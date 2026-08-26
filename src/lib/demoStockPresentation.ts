import type { Lot, StockRecord } from '../types/domain';

const PRESERVED_DISCREPANCIES: Record<string, { declared: number; verified: number }> = {
  'A-204': { declared: 25000, verified: 24000 },
  'C-102': { declared: 18500, verified: 18000 },
  'B-221': { declared: 16000, verified: 15200 },
  'D-405': { declared: 19500, verified: 18700 },
  'E-090': { declared: 12500, verified: 11300 },
  'G-512': { declared: 21000, verified: 19800 },
};

const EXPORT_LOT = 'A-310';
const TARGET_DISCREPANCIES = 6;
const GAPS = [1000, 500, 800, 350, 1200];

function lotCodeById(lots: Lot[]): Map<string, string> {
  return new Map(lots.map((lot) => [lot.id, lot.code]));
}

function isDiscrepancy(record: StockRecord): boolean {
  return !record.verificationPending && record.verifiedQuantity !== record.declaredQuantity;
}

export function presentStockForOralDemo(stockRecords: StockRecord[], lots: Lot[]): StockRecord[] {
  const codes = lotCodeById(lots);
  const now = '2026-08-22T12:00:00Z';

  const verified = stockRecords.map((record) => {
    const code = codes.get(record.lotId);
    const preserved = code ? PRESERVED_DISCREPANCIES[code] : undefined;
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
      if (!code || code === EXPORT_LOT || PRESERVED_DISCREPANCIES[code]) return false;
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
