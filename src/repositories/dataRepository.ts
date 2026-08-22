import { initialTraceabilityEvents } from '../data/traceability';
import { locations as mockLocations } from '../data/locations';
import { lots as mockLots } from '../data/lots';
import { movements as mockMovements } from '../data/movements';
import { stockRecords as mockStockRecords } from '../data/stock';
import type { Location, Lot, Movement, StockRecord, TraceabilityEvent } from '../types/domain';

export type DataSource = 'database' | 'mock';

export interface PapaStockSnapshot {
  locations: Location[];
  lots: Lot[];
  stockRecords: StockRecord[];
  movements: Movement[];
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
    lots: mockLots.map((item) => ({ ...item })),
    stockRecords: mockStockRecords.map((item) => ({ ...item })),
    movements: mockMovements.map((item) => ({ ...item })),
    traceabilityEvents: initialTraceabilityEvents.map((item) => ({ ...item, data: { ...item.data } })),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'error desconocido';
}

function isSnapshot(value: unknown): value is PapaStockSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return ['locations', 'lots', 'stockRecords', 'movements', 'traceabilityEvents']
    .every((key) => Array.isArray(candidate[key]));
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
    return { data: payload.data, source: 'database' };
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
