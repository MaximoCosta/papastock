import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { Movement, MovementItem, TraceabilityEvent } from '../../src/types/domain';
import { showcaseManifest } from '../db/showcaseDataset';
import {
  buildAiOperationsContext,
  createAiOperationsAssistant,
  measureAiOperationsContext,
} from './aiOperationsAssistant';

export const LOT_HISTORY_QUESTION = '¿Qué pasó con SHOW-001?';
export const PINNED_TIMESTAMP = '2026-08-24T12:00:00.000Z';
export const OPERATIONS_MODEL = 'openai/gpt-oss-20b';

export const PRODUCTION_LOT_HISTORY_TELEMETRY = {
  questionBytes: 26,
  contextBytes: 3916,
  systemPromptBytes: 913,
  schemaBytes: 911,
  messagesBytes: 5442,
  requestBodyBytes: 6529,
  estimatedInputTokens: 1633,
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

export function showcaseOperationsSnapshot(): PapaStockSnapshot {
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
      id: row.id,
      code: row.code,
      variety: row.variety,
      campaign: row.campaign,
      producer: row.producer,
      origin: row.origin,
      harvestDate: row.harvestDate,
    })),
    stockRecords: showcaseManifest.stockRecords.map((row) => ({
      id: row.id,
      lotId: row.lotId,
      locationId: row.locationId,
      declaredQuantity: row.declaredQuantity,
      verifiedQuantity: row.verifiedQuantity,
      verificationPending: row.verificationPending,
      updatedAt: row.updatedAt,
      unit: row.unit,
      version: row.version,
    })),
    movements,
    traceabilityEvents,
    discrepancies: [],
    stockCounts: [],
  };
}

export interface CapturedLotHistoryRequest {
  context: ReturnType<typeof buildAiOperationsContext>;
  contextMetrics: ReturnType<typeof measureAiOperationsContext>;
  payload: {
    model: string;
    temperature: number;
    messages: Array<{ role: string; content: string }>;
    response_format: {
      type: string;
      json_schema: { name: string; strict: boolean; schema: Record<string, unknown> };
    };
  };
  requestBodyBytes: number;
  questionBytes: number;
}

export async function captureLotHistoryStructuredRequest(
  snapshot = showcaseOperationsSnapshot(),
  timestamp = PINNED_TIMESTAMP,
): Promise<CapturedLotHistoryRequest> {
  let sentBody = '';
  const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => {
    sentBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ error: { code: 'fixture_capture', type: 'invalid_request' } }), {
      status: 400,
      headers: { 'x-request-id': 'req-capture' },
    });
  }) as unknown as typeof fetch;

  const question = LOT_HISTORY_QUESTION;
  const context = buildAiOperationsContext(question, snapshot, timestamp);
  const info = console.info;
  const warn = console.warn;
  console.info = () => undefined;
  console.warn = () => undefined;
  try {
    await createAiOperationsAssistant({
      apiKey: 'fixture',
      model: OPERATIONS_MODEL,
      timeoutMs: 100,
      fetchImpl,
    })(question, context);
  } catch {
    // Expected: fixture 400 falls back to the deterministic heuristic.
  } finally {
    console.info = info;
    console.warn = warn;
  }

  if (!sentBody) throw new Error('No se serializó el request LOT_HISTORY.');
  return {
    context,
    contextMetrics: measureAiOperationsContext(context),
    payload: JSON.parse(sentBody) as CapturedLotHistoryRequest['payload'],
    requestBodyBytes: Buffer.byteLength(sentBody, 'utf8'),
    questionBytes: Buffer.byteLength(question, 'utf8'),
  };
}

export function safeRequestMeta(captured: CapturedLotHistoryRequest) {
  const schema = captured.payload.response_format.json_schema;
  return {
    model: captured.payload.model,
    temperature: captured.payload.temperature,
    responseFormatType: captured.payload.response_format.type,
    schemaName: schema.name,
    strict: schema.strict,
    systemRole: captured.payload.messages[0]?.role,
    userRole: captured.payload.messages[1]?.role,
    questionBytes: captured.questionBytes,
    contextBytes: captured.contextMetrics.contextBytes,
    systemPromptBytes: Buffer.byteLength(captured.payload.messages[0]?.content ?? '', 'utf8'),
    schemaBytes: Buffer.byteLength(JSON.stringify(schema.schema), 'utf8'),
    messagesBytes: Buffer.byteLength(JSON.stringify(captured.payload.messages), 'utf8'),
    requestBodyBytes: captured.requestBodyBytes,
    estimatedInputTokens: Math.ceil(captured.requestBodyBytes / 4),
    counts: captured.contextMetrics.counts,
    intent: captured.context.intent,
    ledgerBlockingIssues: captured.context.ledger.blockingIssues,
  };
}
