import type {
  Location,
  Lot,
  Movement,
  MovementIntent,
  MovementInterpretation,
  MovementStatus,
  Shelf,
  ShelfUnit,
  StockRecord,
  StockTransferPreview,
  TraceabilityEvent,
  Transporter,
  ValidationError,
} from '../types/domain';
import type { DiscrepancyAnalysis } from '../types/export';

export interface NormalizedSnapshot {
  locations: Location[];
  lots: Lot[];
  stockRecords: StockRecord[];
  movements: Movement[];
  traceabilityEvents: TraceabilityEvent[];
  shelves: Shelf[];
  shelfUnits: ShelfUnit[];
  transporters: Transporter[];
}

const PRODUCTION_API = 'https://papasudbackend.onrender.com';

export function apiUrl(path: string): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const base = envBase || (import.meta.env.PROD ? PRODUCTION_API : '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function usesRemoteApi(): boolean {
  return Boolean((import.meta.env.VITE_API_BASE_URL ?? '').trim() || import.meta.env.PROD);
}

export async function readApiData<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({})) as {
    data?: T;
    error?: string;
    message?: string;
    detail?: string;
  };
  if (!response.ok || payload.data === undefined) {
    throw new Error(payload.error ?? payload.message ?? payload.detail ?? `${fallback} (HTTP ${response.status})`);
  }
  return payload.data;
}

export function toIsoDateTime(date: string): string {
  return /T/.test(date) ? date : `${date}T12:00:00Z`;
}

export function movementIntentBody(intent: MovementIntent): MovementIntent {
  return {
    action: 'transfer',
    lotCode: intent.lotCode,
    origin: intent.origin,
    destination: intent.destination,
    quantityKg: intent.quantityKg,
  };
}

export function traceabilityBody(event: TraceabilityEvent): Record<string, unknown> {
  if (!usesRemoteApi()) {
    return { ...event, data: event.data };
  }
  return {
    lotId: event.lotId,
    type: event.type,
    date: toIsoDateTime(event.date),
    ...(event.locationId ? { locationId: event.locationId } : {}),
    data: event.data,
  };
}

export function normalizeMovementInterpretation(data: unknown): MovementInterpretation {
  const candidate = (data ?? {}) as Partial<MovementInterpretation> & { confidence?: number };
  return {
    action: 'transfer',
    lotCode: String(candidate.lotCode ?? ''),
    origin: String(candidate.origin ?? ''),
    destination: String(candidate.destination ?? ''),
    quantityKg: Number(candidate.quantityKg ?? 0),
    engine: candidate.engine === 'heuristic' ? 'heuristic' : 'llm',
  };
}

function asValidationErrors(errors: unknown): ValidationError[] {
  if (!Array.isArray(errors)) return [];
  return errors.map((item) => {
    if (typeof item === 'string') return { code: 'VALIDATION', message: item };
    const error = item as Partial<ValidationError>;
    return {
      code: String(error.code ?? 'VALIDATION'),
      message: String(error.message ?? 'Validación rechazada.'),
    };
  });
}

export function normalizeTransferPreview(data: unknown): StockTransferPreview {
  const preview = (data ?? {}) as StockTransferPreview;
  return {
    ...preview,
    valid: Boolean(preview.valid),
    errors: asValidationErrors(preview.errors),
    intent: preview.intent ?? movementIntentBody({
      action: 'transfer',
      lotCode: '',
      origin: '',
      destination: '',
      quantityKg: 0,
    }),
    originStock: preview.originStock
      ? {
          declaredQuantity: Number(preview.originStock.declaredQuantity ?? 0),
          verifiedQuantity: Number(preview.originStock.verifiedQuantity ?? 0),
        }
      : undefined,
  };
}

export function normalizeDiscrepancyAnalysis(data: unknown): DiscrepancyAnalysis {
  const candidate = (data ?? {}) as Partial<DiscrepancyAnalysis> & {
    hypothesis?: string;
    suggestedAction?: string;
  };
  const hypothesis = candidate.hypothesis?.trim();
  return {
    engine: candidate.engine === 'heuristic' ? 'heuristic' : 'llm',
    summary: candidate.summary ?? hypothesis ?? 'Sin resumen disponible.',
    confidence: Number(candidate.confidence ?? 0),
    explainedQuantity: Number(candidate.explainedQuantity ?? 0),
    unexplainedQuantity: Number(candidate.unexplainedQuantity ?? 0),
    hypotheses: candidate.hypotheses?.length
      ? candidate.hypotheses
      : hypothesis
        ? [{ title: 'Hipótesis', explanation: hypothesis, movementReferences: [] }]
        : [],
    evidence: candidate.evidence ?? [],
    recommendedAction: candidate.recommendedAction ?? candidate.suggestedAction ?? 'Revisar el lote con el operador.',
    relatedMovementId: candidate.relatedMovementId,
    relatedMovementReference: candidate.relatedMovementReference,
  };
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMovementStatus(status: unknown): MovementStatus {
  if (status === 'pending') return 'pending';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'completed';
}

export function normalizeSnapshot(data: {
  locations: Location[];
  lots: Lot[];
  stockRecords: StockRecord[];
  movements: Movement[];
  traceabilityEvents: TraceabilityEvent[];
  shelves?: Shelf[];
  shelfUnits?: ShelfUnit[];
  transporters?: Transporter[];
}): NormalizedSnapshot {
  return {
    locations: data.locations.map((location) => ({
      ...location,
      name: location.name || 'Sin nombre',
      type: location.type === 'cold_storage' ? 'cold_storage' : 'warehouse',
    })),
    lots: data.lots.map((lot) => ({
      ...lot,
      variety: lot.variety || 'Sin variedad',
      campaign: lot.campaign || '',
      producer: lot.producer || '',
      origin: lot.origin || '',
      harvestDate: lot.harvestDate || undefined,
    })),
    stockRecords: data.stockRecords.map((record) => ({
      ...record,
      declaredQuantity: asNumber(record.declaredQuantity),
      verifiedQuantity: asNumber(record.verifiedQuantity),
      updatedAt: record.updatedAt || new Date().toISOString(),
    })),
    movements: data.movements.map((movement) => ({
      ...movement,
      quantity: asNumber(movement.quantity),
      date: movement.date || '',
      status: normalizeMovementStatus(movement.status),
      reference: movement.reference || movement.id,
    })),
    traceabilityEvents: (data.traceabilityEvents ?? []).map((event) => ({
      ...event,
      date: event.date?.slice(0, 10) ?? event.date,
      data: event.data ?? {},
    })),
    shelves: Array.isArray(data.shelves) ? data.shelves : [],
    shelfUnits: Array.isArray(data.shelfUnits) ? data.shelfUnits : [],
    transporters: Array.isArray(data.transporters) ? data.transporters : [],
  };
}
