import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { stockRecords } from '../data/stock';
import type { StockStatus, StockView } from '../types/domain';

export function getStockStatus(declared: number, verified: number, pending = false): StockStatus {
  if (pending) return 'pending';
  return declared === verified ? 'verified' : 'discrepancy';
}

export function getStockViews(): StockView[] {
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

export function getStockViewByLotId(lotId: string): StockView | undefined {
  return getStockViews().find((record) => record.lotId === lotId);
}

export function getOperationalMetrics() {
  const stock = getStockViews();
  return {
    totalStock: stock.reduce((total, record) => total + record.verifiedQuantity, 0),
    activeLots: new Set(stock.map((record) => record.lotId)).size,
    discrepancies: stock.filter((record) => record.status === 'discrepancy').length,
    pendingExports: 1,
  };
}

