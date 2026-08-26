import { initialTraceabilityEvents } from '../data/traceability';
import { isExplicitMockMode } from '../config/dataMode';
import { locations as mockLocations } from '../data/locations';
import { lots as mockLots } from '../data/lots';
import { movements as mockMovements } from '../data/movements';
import { shelves as mockShelves } from '../data/shelves';
import { shelfUnits as mockShelfUnits } from '../data/shelfUnits';
import { stockRecords as mockStockRecords } from '../data/stock';
import { transporters as mockTransporters } from '../data/transporters';
import { apiFetch, apiRequest, normalizeSnapshot, traceabilityBody } from '../services/apiClient';
import { presentStockForOralDemo, projectOralDemoSnapshot } from '../lib/demoStockPresentation';
import type { Discrepancy, Location, Lot, Movement, Shelf, ShelfUnit, StockCount, StockRecord, TraceabilityEvent, Transporter } from '../types/domain';

export type DataSource = 'database' | 'mock' | 'unavailable';

export interface PapaStockSnapshot {
  locations: Location[];
  shelfUnits: ShelfUnit[];
  shelves: Shelf[];
  lots: Lot[];
  stockRecords: StockRecord[];
  movements: Movement[];
  transporters: Transporter[];
  traceabilityEvents: TraceabilityEvent[];
  discrepancies?: Discrepancy[];
  stockCounts?: StockCount[];
}

export interface SnapshotResult {
  data: PapaStockSnapshot;
  source: DataSource;
  warning?: string;
}

function withDemoStock(snapshot: PapaStockSnapshot): PapaStockSnapshot {
  return {
    ...snapshot,
    stockRecords: presentStockForOralDemo(snapshot.stockRecords, snapshot.lots),
  };
}

function mockSnapshot(): PapaStockSnapshot {
  return withDemoStock({
    locations: mockLocations.map((item) => ({ ...item })),
    shelfUnits: mockShelfUnits.map((item) => ({ ...item })),
    shelves: mockShelves.map((item) => ({ ...item })),
    lots: mockLots.map((item) => ({ ...item })),
    stockRecords: mockStockRecords.map((item) => ({ ...item })),
    movements: mockMovements.map((item) => ({ ...item, items: item.items ? item.items.map((line) => ({ ...line })) : undefined })),
    transporters: mockTransporters.map((item) => ({ ...item })),
    traceabilityEvents: initialTraceabilityEvents.map((item) => ({ ...item, data: { ...item.data } })),
    discrepancies: [],
    stockCounts: [],
  });
}

function emptySnapshot(): PapaStockSnapshot {
  return {
    locations: [], shelfUnits: [], shelves: [], lots: [], stockRecords: [], movements: [],
    transporters: [], traceabilityEvents: [], discrepancies: [], stockCounts: [],
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'error desconocido';
}

function isSnapshot(value: unknown): value is Omit<PapaStockSnapshot, 'shelfUnits' | 'shelves' | 'transporters'> & {
  shelves?: Shelf[];
  shelfUnits?: ShelfUnit[];
  transporters?: Transporter[];
} {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const required = ['locations', 'lots', 'stockRecords', 'movements', 'traceabilityEvents'];
  if (!required.every((key) => Array.isArray(candidate[key]))) return false;
  if (candidate.shelves !== undefined && !Array.isArray(candidate.shelves)) return false;
  if (candidate.shelfUnits !== undefined && !Array.isArray(candidate.shelfUnits)) return false;
  if (candidate.transporters !== undefined && !Array.isArray(candidate.transporters)) return false;
  return true;
}

export async function loadPapaStockSnapshot(): Promise<SnapshotResult> {
  if (isExplicitMockMode()) {
    return { data: mockSnapshot(), source: 'mock', warning: 'Modo demo mock forzado. Los cambios son temporales.' };
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await apiFetch('/api/snapshot', { signal: controller.signal });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    const payload = await response.json() as { data?: unknown };
    if (!isSnapshot(payload.data) || !payload.data.locations.length || !payload.data.lots.length || !payload.data.stockRecords.length) {
      throw new Error('snapshot remoto inválido o sin seed');
    }
    const snapshot = projectOralDemoSnapshot(normalizeSnapshot(payload.data));
    return {
      data: snapshot,
      source: 'database',
    };
  } catch (error) {
    return {
      data: emptySnapshot(),
      source: 'unavailable',
      warning: `La API no respondió (${errorMessage(error)}). No se sustituyeron datos reales por datos mock.`,
    };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function insertTraceabilityEvent(event: TraceabilityEvent): Promise<TraceabilityEvent> {
  return apiRequest<TraceabilityEvent>('/api/traceability', 'No se pudo guardar la trazabilidad.', {
    method: 'POST',
    body: traceabilityBody(event),
  });
}
