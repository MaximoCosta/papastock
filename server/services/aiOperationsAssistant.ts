import { z } from 'zod';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { stockUnit } from '../../src/lib/quantity';
import type { OperationsAssistantAnswer, OperationsAssistantEntity } from '../../src/types/operationsAssistant';
import { verifyLedgerAuthority } from './ledgerVerifier';
import { GroqHttpError, requestStructuredOutput, type GroqOptions, type StructuredRequest } from './groqStructured';

const CONTEXT_LIMITS = {
  lots: 250,
  locations: 50,
  stockRecords: 1_000,
  movements: 750,
  movementItems: 2_500,
  traceability: 2_000,
  discrepancies: 1_000,
  stockCounts: 1_000,
} as const;

const CLOSED_WORLD_WARNING = 'El stock operativo persistido es la referencia actual; el historial de movimientos todavía no reconstruye todos los saldos.';
const MAX_CONTEXT_BYTES = 512_000;
const GLOBAL_AUTHORITY_CLAIMS = [
  /\bel ledger (?:confirma|valida|reconstruye) (?:todo(?: el inventario)?|todos? los saldos|los saldos|el inventario(?: completo)?)\b/,
  /\bel historial(?: de movimientos)? (?:confirma|valida|reconstruye) (?:completamente|por completo|todo) (?:el inventario|los saldos)\b/,
];

export const operationsAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4_000),
  confidence: z.enum(['high', 'medium', 'low']),
  dataQuality: z.enum(['authoritative', 'operational_only', 'incomplete']),
  entities: z.array(z.object({
    type: z.enum(['lot', 'location', 'movement']),
    id: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(160),
  })).max(30),
  warnings: z.array(z.string().trim().min(1).max(500)).max(20),
  evidence: z.array(z.object({
    source: z.enum(['stock_records', 'movements', 'ledger']),
    description: z.string().trim().min(1).max(500),
  })).min(1).max(30),
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'confidence', 'dataQuality', 'entities', 'warnings', 'evidence'],
  properties: {
    answer: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    dataQuality: { type: 'string', enum: ['authoritative', 'operational_only', 'incomplete'] },
    entities: {
      type: 'array', maxItems: 30,
      items: {
        type: 'object', additionalProperties: false, required: ['type', 'id', 'label'],
        properties: {
          type: { type: 'string', enum: ['lot', 'location', 'movement'] },
          id: { type: 'string' }, label: { type: 'string' },
        },
      },
    },
    warnings: { type: 'array', maxItems: 20, items: { type: 'string' } },
    evidence: {
      type: 'array', minItems: 1, maxItems: 30,
      items: {
        type: 'object', additionalProperties: false, required: ['source', 'description'],
        properties: {
          source: { type: 'string', enum: ['stock_records', 'movements', 'ledger'] },
          description: { type: 'string' },
        },
      },
    },
  },
} as const;

function assertWithinLimit(name: keyof typeof CONTEXT_LIMITS, count: number): void {
  if (count > CONTEXT_LIMITS[name]) {
    throw Object.assign(new Error(`El contexto ${name} supera el límite seguro.`), { status: 413 });
  }
}

function safeTraceabilityData(data: Record<string, unknown>): Record<string, string | number | boolean> {
  const allowed = new Set([
    'product', 'cause', 'source', 'origin', 'expectedQuantity', 'verifiedQuantity',
    'difference', 'unit', 'movementReference', 'receivedQuantity', 'countedQuantity',
  ]);
  return Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    allowed.has(key) && ['string', 'number', 'boolean'].includes(typeof value),
  )) as Record<string, string | number | boolean>;
}

export function buildAiOperationsContext(snapshot: PapaStockSnapshot, timestamp = new Date().toISOString()) {
  const movementItems = snapshot.movements.flatMap((movement) => (movement.items ?? []).map((item) => ({
    id: item.id,
    movementId: movement.id,
    lotId: item.lotId,
    quantity: item.dispatchedQuantity,
    receivedQuantity: item.receivedQuantity,
    unit: item.unit,
    data: item.data?.effect ? { effect: item.data.effect } : undefined,
  })));

  assertWithinLimit('lots', snapshot.lots.length);
  assertWithinLimit('locations', snapshot.locations.length);
  assertWithinLimit('stockRecords', snapshot.stockRecords.length);
  assertWithinLimit('movements', snapshot.movements.length);
  assertWithinLimit('movementItems', movementItems.length);
  assertWithinLimit('traceability', snapshot.traceabilityEvents.length);
  assertWithinLimit('discrepancies', snapshot.discrepancies?.length ?? 0);
  assertWithinLimit('stockCounts', snapshot.stockCounts?.length ?? 0);

  const ledger = verifyLedgerAuthority({
    lots: snapshot.lots.map(({ id, code }) => ({ id, code })),
    locations: snapshot.locations.map(({ id, name }) => ({ id, name })),
    movements: snapshot.movements.map((movement) => ({
      id: movement.id,
      reference: movement.reference,
      kind: movement.kind ?? 'transfer',
      status: movement.status,
      lotId: movement.lotId,
      quantity: movement.quantity,
      originLocationId: movement.originLocationId,
      destinationLocationId: movement.destinationLocationId,
      correctsMovementId: movement.correctsMovementId,
    })),
    movementItems,
    stockRecords: snapshot.stockRecords.map((record) => ({
      id: record.id,
      lotId: record.lotId,
      locationId: record.locationId,
      unit: stockUnit(record),
      declaredQuantity: record.declaredQuantity,
      verifiedQuantity: record.verifiedQuantity,
      verificationPending: Boolean(record.verificationPending),
    })),
  });

  const context = {
    timestamp,
    lots: snapshot.lots.map(({ id, code, variety, campaign, producer, origin, harvestDate }) => ({
      id, code, variety, campaign, producer, origin, harvestDate,
    })),
    locations: snapshot.locations.map(({ id, name, type }) => ({ id, name, type })),
    stockRecords: snapshot.stockRecords.map((record) => ({
      id: record.id,
      lotId: record.lotId,
      locationId: record.locationId,
      declaredQuantity: record.declaredQuantity,
      verifiedQuantity: record.verifiedQuantity,
      verificationPending: Boolean(record.verificationPending),
      unit: stockUnit(record),
      updatedAt: record.updatedAt,
    })),
    movements: snapshot.movements.map((movement) => ({
      id: movement.id,
      reference: movement.reference,
      kind: movement.kind ?? 'transfer',
      status: movement.status,
      date: movement.date,
      originLocationId: movement.originLocationId,
      destinationLocationId: movement.destinationLocationId,
      receptionStatus: movement.receptionStatus ?? 'not_applicable',
      correctsMovementId: movement.correctsMovementId,
    })),
    movementItems,
    traceability: snapshot.traceabilityEvents.map((event) => ({
      id: event.id,
      lotId: event.lotId,
      type: event.type,
      date: event.date,
      locationId: event.locationId,
      data: safeTraceabilityData(event.data),
    })),
    discrepancies: (snapshot.discrepancies ?? []).map((item) => ({
      id: item.id,
      lotId: item.lotId,
      locationId: item.locationId,
      movementId: item.movementId,
      type: item.type,
      expectedQuantity: item.expectedQuantity,
      observedQuantity: item.observedQuantity,
      difference: item.difference,
      unit: item.unit,
      status: item.status,
      cause: item.cause,
    })),
    stockCounts: (snapshot.stockCounts ?? []).map((item) => ({
      id: item.id,
      lotId: item.lotId,
      locationId: item.locationId,
      expectedQuantity: item.expectedQuantity,
      observedQuantity: item.observedQuantity,
      difference: item.difference,
      unit: item.unit,
      countedAt: item.countedAt,
    })),
    ledger: {
      ledgerAuthority: ledger.ledgerAuthority,
      classifications: ledger.coordinates,
      blockingIssues: ledger.blockingIssues,
      classificationCounts: ledger.classificationCounts,
    },
  };
  if (Buffer.byteLength(JSON.stringify(context), 'utf8') > MAX_CONTEXT_BYTES) {
    throw Object.assign(new Error('El contexto operativo supera el límite seguro de 512 KB.'), { status: 413 });
  }
  return context;
}

export type AiOperationsContext = ReturnType<typeof buildAiOperationsContext>;

export function measureAiOperationsContext(context: AiOperationsContext) {
  const jsonBytes = Buffer.byteLength(JSON.stringify(context), 'utf8');
  return {
    jsonBytes,
    estimatedInputTokens: Math.ceil(jsonBytes / 4),
    counts: {
      lots: context.lots.length,
      locations: context.locations.length,
      stockRecords: context.stockRecords.length,
      movements: context.movements.length,
      movementItems: context.movementItems.length,
      traceability: context.traceability.length,
      discrepancies: context.discrepancies.length,
      stockCounts: context.stockCounts.length,
      ledgerClassifications: context.ledger.classifications.length,
      ledgerBlockingIssues: context.ledger.blockingIssues.length,
    },
  };
}

function canonicalEntities(context: AiOperationsContext): Map<string, OperationsAssistantEntity> {
  const result = new Map<string, OperationsAssistantEntity>();
  for (const lot of context.lots) result.set(`lot:${lot.id}`, { type: 'lot', id: lot.id, label: lot.code });
  for (const location of context.locations) result.set(`location:${location.id}`, { type: 'location', id: location.id, label: location.name });
  for (const movement of context.movements) result.set(`movement:${movement.id}`, { type: 'movement', id: movement.id, label: movement.reference });
  return result;
}

function validateClosedWorld(answer: OperationsAssistantAnswer, context: AiOperationsContext): OperationsAssistantAnswer {
  const allowed = canonicalEntities(context);
  const entities = answer.entities.map((entity) => {
    const canonical = allowed.get(`${entity.type}:${entity.id}`);
    if (!canonical) throw new Error(`Entidad fuera del contexto: ${entity.type}:${entity.id}`);
    return canonical;
  });

  const normalized = answer.answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!context.ledger.ledgerAuthority && GLOBAL_AUTHORITY_CLAIMS.some((pattern) => pattern.test(normalized))) {
    throw new Error('El modelo afirmó autoridad global inexistente del ledger.');
  }

  return {
    ...answer,
    dataQuality: !context.ledger.ledgerAuthority && answer.dataQuality === 'authoritative'
      ? 'operational_only'
      : answer.dataQuality,
    entities,
    warnings: context.ledger.ledgerAuthority
      ? answer.warnings
      : [...new Set([CLOSED_WORLD_WARNING, ...answer.warnings])],
  };
}

type AiOperationsOptions = GroqOptions & {
  wait?: (milliseconds: number) => Promise<void>;
  now?: () => number;
};

async function requestWithSingleRateLimitRetry(
  options: AiOperationsOptions,
  request: StructuredRequest,
): Promise<unknown> {
  const now = options.now ?? Date.now;
  const wait = options.wait ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const deadline = now() + options.timeoutMs;

  try {
    return await requestStructuredOutput(options, request);
  } catch (error) {
    if (!(error instanceof GroqHttpError) || error.status !== 429) throw error;
    const retryAfterMs = error.retryAfterSeconds === undefined ? undefined : error.retryAfterSeconds * 1_000;
    const remainingBeforeWait = deadline - now();
    if (retryAfterMs === undefined || retryAfterMs >= remainingBeforeWait) throw error;
    await wait(retryAfterMs);
    const remainingAfterWait = Math.floor(deadline - now());
    if (remainingAfterWait <= 0) throw error;
    return requestStructuredOutput({ ...options, timeoutMs: remainingAfterWait }, request);
  }
}

function controlledRateLimitError(
  error: GroqHttpError,
  contextMetrics: ReturnType<typeof measureAiOperationsContext>,
): Error & { status: number; details?: unknown } {
  console.warn('[ai] límite temporal del asistente operativo:', {
    status: error.status,
    retryAfterSeconds: error.retryAfterSeconds,
    ...error.rateLimitHeaders,
    contextMetrics,
  });
  return Object.assign(
    new Error('El asistente alcanzó un límite temporal. Reintentá en unos segundos.'),
    {
      status: 429,
      ...(error.retryAfterSeconds === undefined
        ? {}
        : { details: { retryAfterSeconds: Math.ceil(error.retryAfterSeconds) } }),
    },
  );
}

export function createAiOperationsAssistant(options: AiOperationsOptions) {
  return async function answerOperationsQuestion(
    question: string,
    context: AiOperationsContext,
  ): Promise<OperationsAssistantAnswer> {
    try {
      const raw = await requestWithSingleRateLimitRetry(options, {
        schemaName: 'papastock_operations_answer',
        jsonSchema,
        system: [
          'Sos el asistente operativo read-only de PapaStock.',
          'Respondé únicamente con datos presentes en el JSON de contexto; si falta evidencia, decilo explícitamente.',
          'No inventes lotes, ubicaciones, movimientos, cantidades, fechas ni causalidades.',
          'Nunca propongas ni ejecutes SQL, migraciones, escrituras, transferencias, recepciones o correcciones.',
          'Diferenciá stock_records operativo del ledger reconstruido.',
          'Si ledgerAuthority es false, dataQuality DEBE ser operational_only o incomplete, nunca authoritative.',
          'Si ledgerAuthority es false, no afirmes autoridad global del ledger; una coordenada MATCH individual puede describirse como conciliada, pero eso NO implica autoridad global.',
          'Las entidades deben usar IDs exactos del contexto.',
          'Respondé exclusivamente con el JSON Schema solicitado.',
        ],
        user: { question, context },
      });
      return validateClosedWorld(operationsAnswerSchema.parse(raw), context);
    } catch (error) {
      if (error instanceof GroqHttpError && error.status === 429) {
        throw controlledRateLimitError(error, measureAiOperationsContext(context));
      }
      console.warn('[ai] asistente operativo no disponible:', error instanceof Error ? error.message : 'respuesta inválida');
      throw Object.assign(new Error('El asistente de inventario no está disponible en este momento.'), { status: 502 });
    }
  };
}
