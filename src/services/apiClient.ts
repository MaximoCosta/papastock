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

export function apiUrl(path: string): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const base = import.meta.env.DEV ? envBase : '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function usesRemoteApi(): boolean {
  return import.meta.env.DEV && Boolean((import.meta.env.VITE_API_BASE_URL ?? '').trim());
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

/**
 * Cliente HTTP único de la app.
 *
 * Todas las llamadas mandan la cookie de sesión. Antes sólo 6 de 25 lo hacían, lo que
 * funcionaba de casualidad porque la API vivía en el mismo origen: apenas pasa a otro
 * origen (dev contra Java, staging), las que faltaban devuelven 401.
 * `credentials: 'include'` es inocuo same-origin, así que producción no cambia.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: { accept: 'application/json', ...(init.headers ?? {}) },
  });
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Se serializa como JSON. Para binarios usar `rawBody`. */
  body?: unknown;
  /** Cuerpo crudo (File, Blob, FormData) con sus propios headers. */
  rawBody?: BodyInit;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Hace la llamada y devuelve el contenido de `data`, o lanza con el mensaje del backend. */
export async function apiRequest<T>(
  path: string,
  fallback: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, rawBody, headers = {}, signal } = options;
  const sendsJson = rawBody === undefined && body !== undefined;
  const response = await apiFetch(path, {
    method,
    signal,
    headers: sendsJson ? { 'content-type': 'application/json', ...headers } : headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  return readApiData<T>(response, fallback);
}

/** Para endpoints que responden 204 y no traen envelope. */
export async function apiRequestVoid(
  path: string,
  fallback: string,
  options: ApiRequestOptions = {},
): Promise<void> {
  const { method = 'POST', body, headers = {}, signal } = options;
  const response = await apiFetch(path, {
    method,
    signal,
    headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok && response.status !== 204) {
    await readApiData(response, fallback);
  }
}

export function toIsoDateTime(date: string): string {
  return /T/.test(date) ? date : `${date}T12:00:00Z`;
}

export function movementIntentBody(intent: MovementIntent): MovementIntent {
  const items = intent.items?.length
    ? intent.items
    : intent.lotCode && intent.quantityKg
      ? [{ lotCode: intent.lotCode, quantity: intent.quantityKg, unit: 'kg' as const }]
      : [];
  return {
    action: 'transfer',
    remitoNumber: intent.remitoNumber,
    origin: intent.origin,
    destination: intent.destination,
    items,
    lotCode: items[0]?.lotCode,
    quantityKg: items.length === 1 && items[0]?.unit === 'kg' ? items[0].quantity : undefined,
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
  const items = Array.isArray(candidate.items) && candidate.items.length
    ? candidate.items.map((item) => ({
      lotCode: String(item.lotCode ?? ''),
      quantity: Number(item.quantity ?? 0),
      unit: item.unit === 'bags' ? 'bags' as const : 'kg' as const,
    }))
    : candidate.lotCode
      ? [{ lotCode: String(candidate.lotCode), quantity: Number(candidate.quantityKg ?? 0), unit: 'kg' as const }]
      : [];
  return {
    action: 'transfer',
    remitoNumber: candidate.remitoNumber || undefined,
    origin: String(candidate.origin ?? ''),
    destination: String(candidate.destination ?? ''),
    items,
    lotCode: items[0]?.lotCode,
    quantityKg: items.length === 1 && items[0]?.unit === 'kg' ? items[0].quantity : undefined,
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
    lines: Array.isArray(preview.lines) ? preview.lines : [],
    remitoNumber: preview.remitoNumber,
    intent: preview.intent ?? movementIntentBody({
      action: 'transfer',
      origin: '',
      destination: '',
      items: [],
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

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeTraceabilityType(value: unknown): TraceabilityEvent['type'] {
  const type = String(value ?? '');
  if (type === 'phytosanitary' || type === 'fitosanitario' || type === 'phytosanitary_treatment') return 'treatment';
  if (type === 'planting' || type === 'harvest' || type === 'treatment' || type === 'quality_control' || type === 'stock_verification') {
    return type;
  }
  return type as TraceabilityEvent['type'];
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
      id: asId(location.id),
      name: location.name || 'Sin nombre',
      type: location.type === 'cold_storage' ? 'cold_storage' : 'warehouse',
    })),
    lots: data.lots.map((lot) => {
      const raw = lot as Lot & { originName?: string; provenance?: string; lot_id?: string };
      return {
        ...lot,
        id: asId(lot.id ?? raw.lot_id),
        variety: lot.variety || 'Sin variedad',
        campaign: lot.campaign || '',
        producer: lot.producer || '',
        origin: asText(lot.origin) || asText(raw.originName) || asText(raw.provenance),
        harvestDate: lot.harvestDate || undefined,
      };
    }),
    stockRecords: data.stockRecords.map((record) => ({
      ...record,
      id: asId(record.id),
      lotId: asId(record.lotId),
      locationId: asId(record.locationId),
      declaredQuantity: asNumber(record.declaredQuantity),
      verifiedQuantity: asNumber(record.verifiedQuantity),
      version: asNumber(record.version),
      updatedAt: record.updatedAt || new Date().toISOString(),
    })),
    movements: data.movements.map((movement) => ({
      ...movement,
      id: asId(movement.id),
      lotId: movement.lotId ? asId(movement.lotId) : movement.items?.[0]?.lotId,
      quantity: movement.quantity == null && !movement.items?.length ? asNumber(movement.quantity) : movement.quantity == null ? undefined : asNumber(movement.quantity),
      date: movement.date || '',
      status: normalizeMovementStatus(movement.status),
      reference: movement.reference || asId(movement.id),
      remitoNumber: movement.remitoNumber || undefined,
      items: Array.isArray(movement.items) ? movement.items : undefined,
    })),
    traceabilityEvents: (data.traceabilityEvents ?? []).map((event) => {
      const raw = event as TraceabilityEvent & {
        eventType?: string;
        event_type?: string;
        lot_id?: string;
      };
      const dataRecord = asRecord(event.data);
      const product = asText(dataRecord.product)
        || asText(dataRecord.producto)
        || asText(dataRecord.productName)
        || asText(dataRecord.activeIngredient)
        || asText(dataRecord.tratamiento);
      return {
        ...event,
        id: asId(event.id),
        lotId: asId(event.lotId ?? raw.lot_id),
        type: normalizeTraceabilityType(event.type ?? raw.eventType ?? raw.event_type),
        date: String(event.date ?? '').slice(0, 10),
        data: product && !asText(dataRecord.product) ? { ...dataRecord, product } : dataRecord,
      };
    }),
    shelves: Array.isArray(data.shelves) ? data.shelves : [],
    shelfUnits: Array.isArray(data.shelfUnits) ? data.shelfUnits : [],
    transporters: Array.isArray(data.transporters) ? data.transporters : [],
  };
}
