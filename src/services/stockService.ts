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

    return [{
      ...record,
      lot,
      location,
      difference: record.verifiedQuantity - record.declaredQuantity,
      status: getStockStatus(
        record.declaredQuantity,
        record.verifiedQuantity,
        record.verificationPending,
      ),
    }];
  });
}

export function getStockViewByLotId(stock: StockView[], lotId: string): StockView | undefined {
  const target = String(lotId);
  return stock.find((record) => String(record.lotId) === target);
}

export function getOperationalMetrics(stock: StockView[]) {
  return {
    totalStock: stock.reduce((total, record) => total + record.verifiedQuantity, 0),
    activeLots: new Set(stock.map((record) => record.lotId)).size,
    discrepancies: stock.filter((record) => record.status === 'discrepancy').length,
    pendingExports: 1,
  };
}
