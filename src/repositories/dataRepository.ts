import { initialTraceabilityEvents } from '../data/traceability';
import { locations as mockLocations } from '../data/locations';
import { lots as mockLots } from '../data/lots';
import { movements as mockMovements } from '../data/movements';
import { shelves as mockShelves } from '../data/shelves';
import { shelfUnits as mockShelfUnits } from '../data/shelfUnits';
import { stockRecords as mockStockRecords } from '../data/stock';
import { transporters as mockTransporters } from '../data/transporters';
import type { Location, Lot, Movement, Shelf, ShelfUnit, StockRecord, TraceabilityEvent, Transporter } from '../types/domain';

export type DataSource = 'database' | 'mock';

export interface PapaStockSnapshot {
  locations: Location[];
  shelfUnits: ShelfUnit[];
  shelves: Shelf[];
  lots: Lot[];
  stockRecords: StockRecord[];
  movements: Movement[];
  transporters: Transporter[];
  traceabilityEvents: TraceabilityEvent[];
}

export interface SnapshotResult {
  data: PapaStockSnapshot;
  source: DataSource;
  warning?: string;
}

function mockSnapshot(): PapaStockSnapshot {
  return {
    locations: mockLocations.map((item) => ({ ...item })),
    shelfUnits: mockShelfUnits.map((item) => ({ ...item })),
    shelves: mockShelves.map((item) => ({ ...item })),
    lots: mockLots.map((item) => ({ ...item })),
    stockRecords: mockStockRecords.map((item) => ({ ...item })),
    movements: mockMovements.map((item) => ({ ...item })),
    transporters: mockTransporters.map((item) => ({ ...item })),
    traceabilityEvents: initialTraceabilityEvents.map((item) => ({ ...item, data: { ...item.data } })),
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
  if (import.meta.env.VITE_DATA_SOURCE?.toLowerCase() === 'mock') {
    return { data: mockSnapshot(), source: 'mock', warning: 'Modo demo mock forzado. Los cambios son temporales.' };
  }

  try {
    const response = await fetch('/api/snapshot', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    const payload = await response.json() as { data?: unknown };
    if (!isSnapshot(payload.data) || !payload.data.locations.length || !payload.data.lots.length || !payload.data.stockRecords.length) {
      throw new Error('snapshot remoto inválido o sin seed');
    }
    return {
      data: {
        ...payload.data,
        shelves: Array.isArray(payload.data.shelves) && payload.data.shelves.length
          ? payload.data.shelves
          : mockShelves.map((item) => ({ ...item })),
        shelfUnits: Array.isArray(payload.data.shelfUnits) && payload.data.shelfUnits.length
          ? payload.data.shelfUnits
          : mockShelfUnits.map((item) => ({ ...item })),
        transporters: Array.isArray(payload.data.transporters) && payload.data.transporters.length
          ? payload.data.transporters
          : mockTransporters.map((item) => ({ ...item })),
      },
      source: 'database',
    };
  } catch (error) {
    return {
      data: mockSnapshot(),
      source: 'mock',
      warning: `La API no respondió (${errorMessage(error)}). Se cargó el snapshot mock completo.`,
    };
  }
}

export async function insertTraceabilityEvent(event: TraceabilityEvent): Promise<TraceabilityEvent> {
  const response = await fetch('/api/traceability', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(event),
  });
  const payload = await response.json().catch(() => ({})) as { data?: TraceabilityEvent; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error ?? `No se pudo guardar la trazabilidad (HTTP ${response.status}).`);
  return payload.data;
}
