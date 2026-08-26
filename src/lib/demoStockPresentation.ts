import { movements as demoMovements } from '../data/movements';
import { initialTraceabilityEvents } from '../data/traceability';
import type { Lot, Movement, StockRecord, TraceabilityEvent } from '../types/domain';
import { movementTouchesLot } from './movements';

export const ORAL_DEMO_DISCREPANCIES: Record<string, { declared: number; verified: number }> = {
  'A-204': { declared: 25000, verified: 24000 },
  'C-102': { declared: 18500, verified: 18000 },
  'B-221': { declared: 16000, verified: 15200 },
  'D-405': { declared: 19500, verified: 18700 },
  'E-090': { declared: 12500, verified: 11300 },
  'G-512': { declared: 21000, verified: 19800 },
};

const DEMO_TRACE_IDS = new Set([
  'trace-b221-verify',
  'trace-d405-verify',
  'trace-e090-verify',
  'trace-g512-verify',
]);

const EXPORT_LOT = 'A-310';
const TARGET_DISCREPANCIES = 6;
const GAPS = [1000, 500, 800, 350, 1200];

function lotCodeById(lots: Lot[]): Map<string, string> {
  return new Map(lots.map((lot) => [lot.id, lot.code]));
}

function isDiscrepancy(record: StockRecord): boolean {
  return !record.verificationPending && record.verifiedQuantity !== record.declaredQuantity;
}

/** Ajusta sólo los 6 lotes de la demo oral. No pisa el resto del snapshot PostgreSQL. */
export function projectOralDemoStock(stockRecords: StockRecord[], lots: Lot[]): StockRecord[] {
  const codes = lotCodeById(lots);
  return stockRecords.map((record) => {
    const code = codes.get(record.lotId);
    const target = code ? ORAL_DEMO_DISCREPANCIES[code] : undefined;
    if (!target) return record;
    return {
      ...record,
      declaredQuantity: target.declared,
      verifiedQuantity: target.verified,
      verificationPending: false,
    };
  });
}

export function projectOralDemoSnapshot<T extends {
  lots: Lot[];
  stockRecords: StockRecord[];
  movements: readonly Movement[];
  traceabilityEvents: readonly TraceabilityEvent[];
}>(snapshot: T): Omit<T, 'stockRecords' | 'movements' | 'traceabilityEvents'> & {
  stockRecords: StockRecord[];
  movements: Movement[];
  traceabilityEvents: TraceabilityEvent[];
} {
  const lotIds = new Set(snapshot.lots.map((lot) => lot.id));
  const references = new Set(snapshot.movements.map((movement) => movement.reference));
  const traceIds = new Set(snapshot.traceabilityEvents.map((event) => event.id));
  const extraMovements = demoMovements
    .filter((movement) => !references.has(movement.reference))
    .filter((movement) => Object.keys(ORAL_DEMO_DISCREPANCIES).some((code) => {
      const lot = snapshot.lots.find((item) => item.code === code);
      return Boolean(lot && movementTouchesLot(movement, lot.id));
    }))
    .map((movement) => ({
      ...movement,
      items: movement.items ? movement.items.map((item) => ({ ...item })) : undefined,
    }));
  const extraTrace = initialTraceabilityEvents
    .filter((event) => DEMO_TRACE_IDS.has(event.id) && !traceIds.has(event.id) && lotIds.has(event.lotId))
    .map((event) => ({ ...event, data: { ...event.data } }));

  return {
    ...snapshot,
    stockRecords: projectOralDemoStock([...snapshot.stockRecords], snapshot.lots),
    movements: [...snapshot.movements, ...extraMovements],
    traceabilityEvents: [...snapshot.traceabilityEvents, ...extraTrace],
  };
}

export function presentStockForOralDemo(stockRecords: StockRecord[], lots: Lot[]): StockRecord[] {
  const codes = lotCodeById(lots);
  const now = '2026-08-22T12:00:00Z';

  const verified = stockRecords.map((record) => {
    const code = codes.get(record.lotId);
    const preserved = code ? ORAL_DEMO_DISCREPANCIES[code] : undefined;
    if (preserved) {
      return {
        ...record,
        declaredQuantity: preserved.declared,
        verifiedQuantity: preserved.verified,
        verificationPending: false,
        updatedAt: record.updatedAt || now,
      };
    }
    if (code === EXPORT_LOT) {
      return { ...record, verificationPending: false, verifiedQuantity: record.declaredQuantity };
    }
    return {
      ...record,
      verifiedQuantity: record.declaredQuantity,
      verificationPending: false,
      updatedAt: record.updatedAt || now,
    };
  });

  const existing = verified.filter(isDiscrepancy).map((record) => record.id);
  const needed = TARGET_DISCREPANCIES - existing.length;
  if (needed <= 0) return verified;

  const candidates = verified
    .filter((record) => {
      const code = codes.get(record.lotId);
      if (!code || code === EXPORT_LOT || ORAL_DEMO_DISCREPANCIES[code]) return false;
      return record.declaredQuantity >= 800;
    })
    .sort((a, b) => b.declaredQuantity - a.declaredQuantity || a.id.localeCompare(b.id))
    .slice(0, needed);

  const extras = new Map(candidates.map((record, index) => {
    const gap = Math.min(GAPS[index] ?? 400, Math.max(50, Math.round(record.declaredQuantity * 0.04)));
    return [record.id, Math.max(0, record.declaredQuantity - gap)] as const;
  }));

  return verified.map((record) => {
    const verifiedQuantity = extras.get(record.id);
    if (verifiedQuantity === undefined) return record;
    return { ...record, verifiedQuantity, verificationPending: false };
  });
}
