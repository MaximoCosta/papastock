import type { Location, Lot, StockRecord, StockStatus, StockView } from '../types/domain';

export function getStockStatus(declared: number, verified: number, pending = false): StockStatus {
  if (pending) return 'pending';
  return declared === verified ? 'verified' : 'discrepancy';
}

export function getStockViews(
  stockRecords: StockRecord[],
  lots: Lot[],
  locations: Location[],
): StockView[] {
  return stockRecords.flatMap((record) => {
    const lot = lots.find((item) => item.id === record.lotId);
    const location = locations.find((item) => item.id === record.locationId);

    if (!lot || !location) return [];

    const declaredQuantity = Number(record.declaredQuantity) || 0;
    const verifiedQuantity = Number(record.verifiedQuantity) || 0;

    return [{
      ...record,
      lot,
      location,
      declaredQuantity,
      verifiedQuantity,
      difference: verifiedQuantity - declaredQuantity,
      status: getStockStatus(
        declaredQuantity,
        verifiedQuantity,
        record.verificationPending,
      ),
    }];
  });
}

export function getStockViewByLotId(stock: StockView[], lotId: string): StockView | undefined {
  const target = String(lotId);
  return stock.find((record) => String(record.lotId) === target);
}

export function getStockViewsByLotId(stock: StockView[], lotId: string): StockView[] {
  const target = String(lotId);
  return stock.filter((record) => String(record.lotId) === target);
}

export function getPriorityStockViewByLotId(stock: StockView[], lotId: string): StockView | undefined {
  const records = getStockViewsByLotId(stock, lotId);
  return records.find((record) => record.status === 'discrepancy')
    ?? records.find((record) => record.status === 'pending')
    ?? records[0];
}

export function operationalQuantity(record: Pick<StockView, 'declaredQuantity' | 'verifiedQuantity' | 'verificationPending' | 'status'>): number {
  if (record.verificationPending || record.status === 'pending') return record.declaredQuantity;
  return record.verifiedQuantity;
}

export function getOperationalMetrics(stock: StockView[]) {
  const kg = stock.filter((record) => (record.unit ?? 'kg') === 'kg');
  return {
    totalStock: kg.reduce((total, record) => total + operationalQuantity(record), 0),
    activeLots: new Set(stock.map((record) => record.lotId)).size,
    discrepancies: stock.filter((record) => record.status === 'discrepancy').length,
    pendingExports: 1,
  };
}
