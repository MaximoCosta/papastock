import { z } from 'zod';
import type { OperationsAssistantAnswer, OperationsAssistantEntity } from '../../src/types/operationsAssistant';
import {
  buildAiOperationsContext,
  measureAiOperationsContext,
  type AiOperationsContext,
} from './aiOperationsContext';
import {
  GroqHttpError,
  GroqRequestBodyLimitError,
  requestStructuredOutput,
  serializeStructuredRequest,
  type GroqOptions,
  type StructuredRequest,
} from './groqStructured';
import { buildCanonicalLotStockAnswer } from './aiOperationsFacts';
import { buildHeuristicOperationsAnswer, HEURISTIC_WARNING } from './aiOperationsHeuristic';

export { buildAiOperationsContext, measureAiOperationsContext } from './aiOperationsContext';
export type { AiOperationsContext, AiOperationsIntent } from './aiOperationsContext';

const CLOSED_WORLD_WARNING = 'El stock operativo persistido es la referencia actual; el historial de movimientos todavía no reconstruye todos los saldos.';
const GLOBAL_AUTHORITY_CLAIMS = [
  /\bel ledger (?:confirma|valida|reconstruye) (?:todo(?: el inventario)?|todos? los saldos|los saldos|el inventario(?: completo)?)\b/,
  /\bel historial(?: de movimientos)? (?:confirma|valida|reconstruye) (?:completamente|por completo|todo) (?:el inventario|los saldos)\b/,
];
const MATCH_AS_VERIFIED_CLAIMS = [
  /\bbalances coincidentes\b/,
  /\bbalances coinciden\b/,
  /\bdeclarado y (?:el )?verificado coinciden\b/,
];
const LOT_HISTORY_STOCK_GROUNDING = 'Nunca interpretes ledger MATCH como prueba de que el stock declarado y el verificado coinciden. Si declared != verified, mencioná la discrepancia explícitamente. Los valores numéricos calculados por PapaStock son hechos autoritativos.';
const DERIVED_FACTS_GROUNDING = 'context.derivedFacts fue calculado determinísticamente por PapaStock y es autoritativo: no lo recalcules ni lo contradigas. Usá los registros crudos sólo para explicar y dar contexto. Un valor null significa desconocido, nunca cero. Diferenciá hechos de inferencias y no afirmes causalidad.';
const EVIDENCE_RECORD_RULE = 'Cada evidencia debe citar únicamente identificadores presentes en el contexto proporcionado. Nunca inventes recordId. Si la fuente representa un hecho derivado que no tiene un único registro identificable, usa null únicamente cuando el contrato lo permita.';

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
    source: z.enum(['stock_records', 'movements', 'ledger', 'traceability']),
    recordId: z.string().trim().min(1).max(120).nullable(),
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
        type: 'object', additionalProperties: false, required: ['source', 'recordId', 'description'],
        properties: {
          source: { type: 'string', enum: ['stock_records', 'movements', 'ledger', 'traceability'] },
          recordId: { type: ['string', 'null'] },
          description: { type: 'string' },
        },
      },
    },
  },
} as const;

const operationsSystemPrompt = [
  'Sos el asistente operativo read-only de PapaStock.',
  'Respondé únicamente con datos presentes en el JSON de contexto proyectado; si falta evidencia, decilo explícitamente.',
  'No inventes lotes, ubicaciones, movimientos, cantidades, fechas ni causalidades.',
  'Nunca propongas ni ejecutes SQL, migraciones, escrituras, transferencias, recepciones o correcciones.',
  'Diferenciá stock_records operativo del ledger reconstruido.',
  'Si ledgerAuthority es false, dataQuality DEBE ser operational_only o incomplete, nunca authoritative.',
  'Si ledgerAuthority es false, no afirmes autoridad global del ledger; una coordenada MATCH individual puede describirse como conciliada, pero eso NO implica autoridad global.',
  'Si ledgerAuthority es true y la evidencia responde completamente la pregunta, dataQuality puede ser authoritative.',
  'Las entidades deben usar IDs exactos del contexto.',
  'Los eventos de traceability deben citarse usando evidence.source="traceability".',
  EVIDENCE_RECORD_RULE,
  'Respondé exclusivamente con el JSON Schema solicitado.',
];

function canonicalEntities(context: AiOperationsContext): Map<string, OperationsAssistantEntity> {
  const result = new Map<string, OperationsAssistantEntity>();
  for (const lot of context.lots) result.set(`lot:${lot.id}`, { type: 'lot', id: lot.id, label: lot.code });
  for (const location of context.locations) result.set(`location:${location.id}`, { type: 'location', id: location.id, label: location.name });
  for (const movement of context.movements) result.set(`movement:${movement.id}`, { type: 'movement', id: movement.id, label: movement.reference });
  return result;
}

export function validateEvidenceReferences(
  answer: Pick<OperationsAssistantAnswer, 'evidence'>,
  context: AiOperationsContext,
): void {
  for (const item of answer.evidence) {
    if (item.source === 'ledger') {
      if (item.recordId !== null) {
        throw new Error('Evidencia ledger no corresponde a un registro persistido.');
      }
      continue;
    }
    if (item.source === 'movements') {
      if (!item.recordId || !context.movements.some((movement) => movement.id === item.recordId)) {
        throw new Error(`Evidencia movements cita un recordId fuera del contexto: ${item.recordId ?? 'null'}`);
      }
      continue;
    }
    if (item.source === 'traceability') {
      if (!item.recordId || !context.traceability.some((event) => event.id === item.recordId)) {
        throw new Error(`Evidencia traceability cita un recordId fuera del contexto: ${item.recordId ?? 'null'}`);
      }
      continue;
    }
    if (item.recordId !== null && !context.stockRecords.some((record) => record.id === item.recordId)) {
      throw new Error(`Evidencia stock_records cita un recordId fuera del contexto: ${item.recordId}`);
    }
  }
}

function withEvidenceLabels(
  answer: z.infer<typeof operationsAnswerSchema>,
): OperationsAssistantAnswer {
  return {
    ...answer,
    evidence: answer.evidence.map((item) => ({ ...item, recordLabel: null })),
  };
}

function attachEvidenceLabels(
  evidence: OperationsAssistantAnswer['evidence'],
  context: AiOperationsContext,
): OperationsAssistantAnswer['evidence'] {
  return evidence.map((item) => {
    if (item.source === 'movements' && item.recordId) {
      const movement = context.movements.find((candidate) => candidate.id === item.recordId);
      return { ...item, recordLabel: movement?.reference ?? null };
    }
    return { ...item, recordLabel: null };
  });
}

function validateClosedWorld(answer: OperationsAssistantAnswer, context: AiOperationsContext): OperationsAssistantAnswer {
  validateEvidenceReferences(answer, context);
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
  if (context.intent === 'LOT_HISTORY') {
    // Se evalúa sobre los mismos hechos derivados que vio el modelo, sin recalcular.
    const hasDeclaredVerifiedGap = (context.derivedFacts?.stock ?? []).some((fact) => (
      fact.hasDiscrepancy === true
      || fact.locations.some((location) => location.hasDiscrepancy === true)
    ));
    if (hasDeclaredVerifiedGap && MATCH_AS_VERIFIED_CLAIMS.some((pattern) => pattern.test(normalized))) {
      throw new Error('El modelo interpretó ledger MATCH como igualdad entre stock declarado y verificado.');
    }
  }

  return {
    ...answer,
    dataQuality: !context.ledger.ledgerAuthority && answer.dataQuality === 'authoritative'
      ? 'operational_only'
      : answer.dataQuality,
    entities,
    evidence: attachEvidenceLabels(answer.evidence, context),
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
    requestBodyBytes: error.requestBodyBytes,
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

function controlledRequestTooLargeError(
  error: GroqHttpError | GroqRequestBodyLimitError,
  contextMetrics: ReturnType<typeof measureAiOperationsContext>,
  requestMetrics: ReturnType<typeof serializeStructuredRequest>['metrics'],
): Error & { status: number; details: unknown } {
  const upstream = error instanceof GroqHttpError;
  console.warn('[ai] request operativo excede el límite seguro:', {
    status: 413,
    source: upstream ? 'groq' : 'local_budget',
    requestBodyBytes: requestMetrics.requestBodyBytes,
    ...(upstream ? { responseError: error.responseError, safeHeaders: error.safeHeaders } : {
      maxRequestBodyBytes: error.maxRequestBodyBytes,
    }),
    contextMetrics,
  });
  return Object.assign(
    new Error('La consulta excede el límite seguro del asistente. Refiná la pregunta o contactá al administrador.'),
    {
      status: 413,
      details: { code: upstream ? 'AI_UPSTREAM_REQUEST_TOO_LARGE' : 'AI_REQUEST_BODY_BUDGET_EXCEEDED' },
    },
  );
}

function logControlledUpstreamError(
  error: GroqHttpError,
  contextMetrics: ReturnType<typeof measureAiOperationsContext>,
): void {
  console.warn('[ai] Groq rechazó la consulta operativa:', {
    status: error.status,
    requestBodyBytes: error.requestBodyBytes,
    responseError: error.responseError,
    safeHeaders: error.safeHeaders,
    contextMetrics,
  });
}

export function createAiOperationsAssistant(options: AiOperationsOptions) {
  return async function answerOperationsQuestion(
    question: string,
    context: AiOperationsContext,
  ): Promise<OperationsAssistantAnswer> {
    const contextMetrics = measureAiOperationsContext(context);
    if (context.intent === 'LOT_STOCK') {
      console.info('[ai] métricas de contexto proyectado:', {
        intent: context.intent,
        mode: 'deterministic',
        questionBytes: Buffer.byteLength(question, 'utf8'),
        contextBytes: contextMetrics.contextBytes,
        selectedCounts: contextMetrics.counts,
      });
      const canonical = validateClosedWorld(
        withEvidenceLabels(operationsAnswerSchema.parse(buildCanonicalLotStockAnswer(context))),
        context,
      );
      return {
        ...canonical,
        engine: 'deterministic',
        warnings: [
          'Hecho canónico calculado por PapaStock desde PostgreSQL. No pasó por Groq ni usa datos mock.',
          ...canonical.warnings,
        ],
      };
    }

    const request: StructuredRequest = {
      schemaName: 'papastock_operations_answer',
      jsonSchema,
      system: context.intent === 'LOT_HISTORY'
        ? [...operationsSystemPrompt, LOT_HISTORY_STOCK_GROUNDING, DERIVED_FACTS_GROUNDING]
        : operationsSystemPrompt,
      user: { question, context },
    };
    const requestMetrics = serializeStructuredRequest(options.model, request).metrics;
    console.info('[ai] métricas de contexto proyectado:', {
      intent: context.intent,
      questionBytes: Buffer.byteLength(question, 'utf8'),
      contextBytes: contextMetrics.contextBytes,
      systemPromptBytes: requestMetrics.systemPromptBytes,
      schemaBytes: requestMetrics.schemaBytes,
      messagesBytes: requestMetrics.messagesBytes,
      requestBodyBytes: requestMetrics.requestBodyBytes,
      estimatedInputTokens: requestMetrics.estimatedInputTokens,
      selectedCounts: contextMetrics.counts,
    });

    try {
      const raw = await requestWithSingleRateLimitRetry(options, request);
      return {
        ...validateClosedWorld(withEvidenceLabels(operationsAnswerSchema.parse(raw)), context),
        engine: 'llm',
      };
    } catch (error) {
      if (error instanceof GroqHttpError && error.status === 429) {
        throw controlledRateLimitError(error, contextMetrics);
      }
      if (error instanceof GroqRequestBodyLimitError
        || (error instanceof GroqHttpError && error.status === 413)) {
        throw controlledRequestTooLargeError(error, contextMetrics, requestMetrics);
      }
      if (error instanceof GroqHttpError) logControlledUpstreamError(error, contextMetrics);
      console.warn('[ai] asistente operativo en heurística:', error instanceof Error ? error.message : 'respuesta inválida');
      const fallback = validateClosedWorld(buildHeuristicOperationsAnswer(context), context);
      if (error instanceof Error && error.message === 'GROQ_API_KEY ausente.') {
        return {
          ...fallback,
          warnings: [
            'Respuesta heurística: GROQ_API_KEY no está configurada en el servidor. Los datos salen del snapshot PostgreSQL; no es un dataset mock.',
            ...fallback.warnings.filter((warning) => warning !== HEURISTIC_WARNING),
          ],
        };
      }
      return fallback;
    }
  };
}
