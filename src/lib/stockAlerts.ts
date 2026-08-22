import type { QuantityUnit, StockAlertKind, StockView } from '../types/domain';
import { stockUnit } from './quantity';

/** TODO: persistir umbral por ubicación cuando exista configuración operativa. */
export const LOW_STOCK_THRESHOLD: Record<QuantityUnit, number> = {
  kg: 2000,
  bags: 50,
};

export function getStockAlert(record: StockView): StockAlertKind | undefined {
  if (record.status === 'discrepancy') return 'discrepancy';
  if (record.verificationPending) return undefined;
  const unit = stockUnit(record);
  if (record.verifiedQuantity <= 0) return 'depleted';
  if (record.verifiedQuantity < LOW_STOCK_THRESHOLD[unit]) return 'low_stock';
  return undefined;
}

export function stockAlertLabel(kind: StockAlertKind): string {
  if (kind === 'discrepancy') return 'Discrepancia';
  if (kind === 'low_stock') return 'Stock bajo';
  if (kind === 'depleted') return 'Agotado';
  return 'Stock insuficiente';
}
