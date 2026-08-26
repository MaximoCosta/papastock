import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { Movement, MovementItem, TraceabilityEvent } from '../../src/types/domain';
import { showcaseManifest } from '../db/showcaseDataset';
import {
  buildAiOperationsContext,
  createAiOperationsAssistant,
  measureAiOperationsContext,
  operationsAnswerSchema,
} from './aiOperationsAssistant';

const LOT_HISTORY_QUESTION = '¿Qué pasó con SHOW-001?';
const PINNED_TIMESTAMP = '2026-08-24T12:00:00.000Z';
const OPERATIONS_MODEL = 'openai/gpt-oss-20b';
const PRODUCTION_LOT_HISTORY_TELEMETRY = {
  questionBytes: 26,
  systemPromptBytes: 913,
  schemaBytes: 911,
  counts: {
    lots: 1,
    locations: 2,
    stockRecords: 2,
    movements: 3,
    movementItems: 3,
    traceability: 2,
    discrepancies: 0,
    stockCounts: 0,
    ledgerClassifications: 2,
    ledgerBlockingIssues: 0,
  },
} as const;

function showcaseOperationsSnapshot(): PapaStockSnapshot {
  const itemsByMovement = new Map<string, MovementItem[]>();
  for (const row of showcaseManifest.movementItems) {
    const items = itemsByMovement.get(row.movementId) ?? [];
    items.push({
      id: row.id,
      movementId: row.movementId,
      lotId: row.lotId,
      dispatchedQuantity: row.dispatchedQuantity,
      receivedQuantity: row.receivedQuantity ?? undefined,
      receivedAt: row.receivedAt ?? undefined,
      unit: row.unit,
      sortOrder: row.sortOrder,
      data: { ...row.data },
    });
    itemsByMovement.set(row.movementId, items);
  }
  const movements: Movement[] = showcaseManifest.movements.map((row) => ({
    id: row.id,
    reference: row.reference,
    lotId: row.lotId ?? undefined,
    originLocationId: row.originLocationId ?? undefined,
    destinationLocationId: row.destinationLocationId ?? undefined,
    quantity: row.quantity,
    date: row.movementDate,
    status: row.status,
    remitoNumber: row.remitoNumber ?? undefined,
    kind: row.kind,
    correctsMovementId: row.correctsMovementId ?? undefined,
    receivedTotal: row.receivedTotal ?? undefined,
    receivedUnit: row.receivedUnit ?? undefined,
    receivedAt: row.receivedAt ?? undefined,
    receptionStatus: row.receptionStatus,
    items: itemsByMovement.get(row.id) ?? [],
  }));
  const traceabilityEvents: TraceabilityEvent[] = showcaseManifest.traceabilityEvents.map((row) => ({
    id: row.id,
    lotId: row.lotId,
    type: row.eventType,
    date: row.eventDate,
    locationId: row.locationId,
    data: { ...row.data },
  }));
  return {
    locations: showcaseManifest.locations.map((row) => ({ ...row })),
    shelfUnits: [],
    shelves: [],
    transporters: [],
    lots: showcaseManifest.lots.map((row) => ({
      id: row.id, code: row.code, variety: row.variety, campaign: row.campaign,
      producer: row.producer, origin: row.origin, harvestDate: row.harvestDate,
    })),
    stockRecords: showcaseManifest.stockRecords.map((row) => ({
      id: row.id, lotId: row.lotId, locationId: row.locationId,
      declaredQuantity: row.declaredQuantity, verifiedQuantity: row.verifiedQuantity,
      verificationPending: row.verificationPending, updatedAt: row.updatedAt,
      unit: row.unit, version: row.version,
    })),
    movements,
    traceabilityEvents,
    discrepancies: [],
    stockCounts: [],
  };
}

async function captureLotHistoryStructuredRequest() {
  let sentBody = '';
  const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => {
    sentBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ error: { code: 'fixture_capture', type: 'invalid_request' } }), {
      status: 400, headers: { 'x-request-id': 'req-capture' },
    });
  }) as unknown as typeof fetch;
  const question = LOT_HISTORY_QUESTION;
  const context = buildAiOperationsContext(question, showcaseOperationsSnapshot(), PINNED_TIMESTAMP);
  const info = console.info;
  const warn = console.warn;
  console.info = () => undefined;
  console.warn = () => undefined;
  try {
    await createAiOperationsAssistant({ apiKey: 'fixture', model: OPERATIONS_MODEL, timeoutMs: 100, fetchImpl })(question, context);
  } catch {
    // Expected fixture 400.
  } finally {
    console.info = info;
    console.warn = warn;
  }
  if (!sentBody) throw new Error('No se serializó el request LOT_HISTORY.');
  const payload = JSON.parse(sentBody) as {
    model: string;
    temperature: number;
    messages: Array<{ role: string; content: string }>;
    response_format: { type: string; json_schema: { name: string; strict: boolean; schema: Record<string, unknown> } };
  };
  const schema = payload.response_format.json_schema;
  const requestBodyBytes = Buffer.byteLength(sentBody, 'utf8');
  return {
    context,
    payload,
    meta: {
      model: payload.model,
      temperature: payload.temperature,
      responseFormatType: payload.response_format.type,
      schemaName: schema.name,
      strict: schema.strict,
      systemRole: payload.messages[0]?.role,
      userRole: payload.messages[1]?.role,
      questionBytes: Buffer.byteLength(question, 'utf8'),
      contextBytes: measureAiOperationsContext(context).contextBytes,
      systemPromptBytes: Buffer.byteLength(payload.messages[0]?.content ?? '', 'utf8'),
      schemaBytes: Buffer.byteLength(JSON.stringify(schema.schema), 'utf8'),
      requestBodyBytes,
      counts: measureAiOperationsContext(context).counts,
      intent: context.intent,
    },
  };
}

const validAnswer = {
  answer: 'SHOW-001 ingresó 10.000 kg y luego se transfirieron 2.000 kg.',
  confidence: 'high' as const,
  dataQuality: 'authoritative' as const,
  entities: [{ type: 'lot' as const, id: 'lot-showcase-001', label: 'SHOW-001' }],
  warnings: [] as string[],
  evidence: [{ source: 'movements' as const, recordId: 'movement-showcase-import-001', description: 'SHOWCASE-IMPORT-001.' }],
};

const envelope = (content: unknown) => new Response(JSON.stringify({
  choices: [{ message: { content: JSON.stringify(content) } }],
}), { status: 200, headers: { 'content-type': 'application/json' } });

describe('diagnóstico LOT_HISTORY SHOW-001 (sin Groq)', () => {
  it('serializa el request exacto con json_schema strict y el contrato de producción', async () => {
    const captured = await captureLotHistoryStructuredRequest();
    const meta = captured.meta;
    const schema = captured.payload.response_format.json_schema;

    expect(meta).toMatchObject({
      model: OPERATIONS_MODEL,
      temperature: 0,
      responseFormatType: 'json_schema',
      schemaName: 'papastock_operations_answer',
      strict: true,
      systemRole: 'system',
      userRole: 'user',
      questionBytes: PRODUCTION_LOT_HISTORY_TELEMETRY.questionBytes,
      intent: 'LOT_HISTORY',
      counts: PRODUCTION_LOT_HISTORY_TELEMETRY.counts,
    });
    expect(schema.strict).toBe(true);
    expect(schema.name).toBe('papastock_operations_answer');
    expect(meta.schemaBytes).toBeGreaterThanOrEqual(PRODUCTION_LOT_HISTORY_TELEMETRY.schemaBytes);
    expect(meta.systemPromptBytes).toBeGreaterThanOrEqual(PRODUCTION_LOT_HISTORY_TELEMETRY.systemPromptBytes);
    expect(meta.requestBodyBytes).toBeLessThan(20_000);

    const fixture = JSON.parse(readFileSync(
      new URL('./fixtures/lot-history-show-001.request.meta.json', import.meta.url),
      'utf8',
    )) as { localShowcase: { contextBytes: number; requestBodyBytes: number; schemaBytes: number; systemPromptBytes: number } };
    expect(meta.contextBytes).toBe(fixture.localShowcase.contextBytes);
    expect(meta.requestBodyBytes).toBe(fixture.localShowcase.requestBodyBytes);
    expect(meta.schemaBytes).toBe(fixture.localShowcase.schemaBytes);
    expect(meta.systemPromptBytes).toBe(fixture.localShowcase.systemPromptBytes);
  });

  it('acepta evidence.source=traceability alineado en Zod y JSON Schema', async () => {
    const captured = await captureLotHistoryStructuredRequest();
    const schema = captured.payload.response_format.json_schema.schema as {
      properties: {
        evidence: { items: { properties: { source: { enum: string[] } } } };
        entities: { items: { properties: { type: { enum: string[] } } } };
      };
    };
    const sources = schema.properties.evidence.items.properties.source.enum;
    expect(captured.context.traceability.map((event) => event.type).sort()).toEqual(['correction', 'stock_verification']);
    expect(sources).toEqual(['stock_records', 'movements', 'ledger', 'traceability']);
    expect(schema.properties.entities.items.properties.type.enum).toEqual(['lot', 'location', 'movement']);
    expect(operationsAnswerSchema.safeParse({
      ...validAnswer,
      evidence: [{ source: 'traceability', recordId: 'trace-showcase-verification-001', description: 'Se verificaron 7.900 kg en Campo Oriente.' }],
    }).success).toBe(true);
  });

  it.each(['stock_records', 'movements', 'ledger'] as const)('sigue aceptando evidence.source=%s', (source) => {
    expect(operationsAnswerSchema.safeParse({
      ...validAnswer,
      evidence: [{
        source,
        recordId: source === 'ledger' ? null : 'stock-showcase-001-oriente-kg',
        description: 'Se verificaron 7.900 kg en Campo Oriente.',
      }],
    }).success).toBe(true);
  });

  it.each(['foo', 'database', 'postgres'] as const)('sigue rechazando evidence.source=%s', (source) => {
    expect(operationsAnswerSchema.safeParse({
      ...validAnswer,
      evidence: [{ source, description: 'Se verificaron 7.900 kg en Campo Oriente.' }],
    } as unknown).success).toBe(false);
  });

  it('mantiene evidence.minItems=1 en JSON Schema y en Zod', async () => {
    const captured = await captureLotHistoryStructuredRequest();
    const schema = captured.payload.response_format.json_schema.schema as {
      properties: { evidence: { minItems?: number; maxItems?: number } };
    };
    expect(schema.properties.evidence.minItems).toBe(1);
    expect(schema.properties.evidence.maxItems).toBe(30);
    expect(operationsAnswerSchema.safeParse({ ...validAnswer, evidence: [] }).success).toBe(false);
    expect(operationsAnswerSchema.safeParse(validAnswer).success).toBe(true);
  });

  it('documenta el drift JSON Schema vs Zod sin cambios inesperados', async () => {
    const captured = await captureLotHistoryStructuredRequest();
    const jsonSchema = captured.payload.response_format.json_schema.schema as {
      additionalProperties: boolean;
      required: string[];
      properties: Record<string, Record<string, unknown>>;
    };

    expect(jsonSchema.additionalProperties).toBe(false);
    expect(jsonSchema.required).toEqual(['answer', 'confidence', 'dataQuality', 'entities', 'warnings', 'evidence']);

    const matrix = {
      answer: {
        jsonSchema: { type: jsonSchema.properties.answer.type, minLength: jsonSchema.properties.answer.minLength ?? null, maxLength: jsonSchema.properties.answer.maxLength ?? null },
        zod: { min: 1, max: 4_000, trim: true },
      },
      confidence: {
        jsonSchema: jsonSchema.properties.confidence.enum,
        zod: ['high', 'medium', 'low'],
      },
      dataQuality: {
        jsonSchema: jsonSchema.properties.dataQuality.enum,
        zod: ['authoritative', 'operational_only', 'incomplete'],
      },
      entities: {
        jsonSchema: { maxItems: jsonSchema.properties.entities.maxItems, minItems: jsonSchema.properties.entities.minItems ?? null },
        zod: { max: 30, min: null },
      },
      warnings: {
        jsonSchema: { maxItems: jsonSchema.properties.warnings.maxItems, minItems: jsonSchema.properties.warnings.minItems ?? null },
        zod: { max: 20, itemMin: 1, itemMax: 500 },
      },
      evidence: {
        jsonSchema: { minItems: jsonSchema.properties.evidence.minItems, maxItems: jsonSchema.properties.evidence.maxItems },
        zod: { min: 1, max: 30 },
      },
    };

    expect(matrix.confidence.jsonSchema).toEqual(matrix.confidence.zod);
    expect(matrix.dataQuality.jsonSchema).toEqual(matrix.dataQuality.zod);
    expect(matrix.evidence.jsonSchema).toEqual({ minItems: 1, maxItems: 30 });
    expect(matrix.entities.jsonSchema.minItems).toBeNull();
    expect(matrix.answer.jsonSchema.minLength).toBeNull();
    expect(matrix.answer.jsonSchema.maxLength).toBeNull();
  });

  it('no reintenta HTTP 400 json_validate_failed y conserva sólo diagnóstico seguro', async () => {
    const secret = 'secret-json-validate-failed-fixture';
    const question = LOT_HISTORY_QUESTION;
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: {
        code: 'json_validate_failed',
        type: 'invalid_request_error',
        message: `${question} ${secret} SHOW-001`,
      },
    }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req_json_validate_fixture' },
    })) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    let caught: unknown;
    try {
      await createAiOperationsAssistant({
        apiKey: secret, model: OPERATIONS_MODEL, timeoutMs: 100, fetchImpl,
      })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), '2026-08-24T12:00:00.000Z'));
    } catch (error) {
      caught = error;
    }

    const logged = JSON.stringify(warn.mock.calls);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(caught).toMatchObject({
      status: 502,
      message: 'El asistente de inventario no está disponible en este momento.',
    });
    expect(logged).toContain('json_validate_failed');
    expect(logged).toContain('invalid_request_error');
    expect(logged).toContain('req_json_validate_fixture');
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain(question);
    expect(JSON.stringify(caught)).not.toContain(secret);
    expect(JSON.stringify(caught)).not.toContain('req_json_validate_fixture');
    warn.mockRestore();
  });

  it('acepta un output LOT_HISTORY simulado con evidence.source=traceability y conserva closed-world', async () => {
    const fetchImpl = vi.fn(async () => envelope({
      answer: 'SHOW-001 se verificó en Campo Oriente.',
      confidence: 'high',
      dataQuality: 'authoritative',
      entities: [{ type: 'lot', id: 'lot-showcase-001', label: 'etiqueta inventada' }],
      warnings: [],
      evidence: [{ source: 'traceability', recordId: 'trace-showcase-verification-001', description: 'Se verificaron 7.900 kg en Campo Oriente.' }],
    })) as unknown as typeof fetch;
    const question = LOT_HISTORY_QUESTION;
    const answer = await createAiOperationsAssistant({
      apiKey: 'fixture', model: OPERATIONS_MODEL, timeoutMs: 100, fetchImpl,
    })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), '2026-08-24T12:00:00.000Z'));
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(answer.evidence).toEqual([
      {
        source: 'traceability',
        recordId: 'trace-showcase-verification-001',
        recordLabel: null,
        description: 'Se verificaron 7.900 kg en Campo Oriente.',
      },
    ]);
    expect(answer.entities).toEqual([{ type: 'lot', id: 'lot-showcase-001', label: 'SHOW-001' }]);
    expect(answer.entities.some((entity) => (entity as { type: string }).type === 'traceability')).toBe(false);
  });

  it('rechaza evidence.source inválido en el flujo LOT_HISTORY simulado', async () => {
    const fetchImpl = vi.fn(async () => envelope({
      answer: 'SHOW-001 se verificó en Campo Oriente.',
      confidence: 'high',
      dataQuality: 'authoritative',
      entities: [{ type: 'lot', id: 'lot-showcase-001', label: 'SHOW-001' }],
      warnings: [],
      evidence: [{ source: 'invalid_source', description: 'Se verificaron 7.900 kg en Campo Oriente.' }],
    })) as unknown as typeof fetch;
    const question = LOT_HISTORY_QUESTION;
    await expect(createAiOperationsAssistant({
      apiKey: 'fixture', model: OPERATIONS_MODEL, timeoutMs: 100, fetchImpl,
    })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), '2026-08-24T12:00:00.000Z')))
      .rejects.toMatchObject({ status: 502 });
  });

  it('rechaza una entidad fuera de contexto aunque la evidencia sea traceability', async () => {
    const fetchImpl = vi.fn(async () => envelope({
      answer: 'SHOW-001 se verificó en Campo Oriente.',
      confidence: 'high',
      dataQuality: 'authoritative',
      entities: [{ type: 'lot', id: 'lot-inventado', label: 'X' }],
      warnings: [],
      evidence: [{ source: 'traceability', recordId: 'trace-showcase-verification-001', description: 'Se verificaron 7.900 kg en Campo Oriente.' }],
    })) as unknown as typeof fetch;
    const question = LOT_HISTORY_QUESTION;
    await expect(createAiOperationsAssistant({
      apiKey: 'fixture', model: OPERATIONS_MODEL, timeoutMs: 100, fetchImpl,
    })(question, buildAiOperationsContext(question, showcaseOperationsSnapshot(), '2026-08-24T12:00:00.000Z')))
      .rejects.toMatchObject({ status: 502 });
  });
});
