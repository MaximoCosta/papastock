import type { QuantityUnit, StockView } from '../types/domain';
import { stockUnit } from './quantity';

export interface VarietyLocationTotal {
  locationId: string;
  locationName: string;
  variety: string;
  unit: QuantityUnit;
  totalDeclared: number;
  totalVerified: number;
  lots: Array<{
    lotId: string;
    lotCode: string;
    declaredQuantity: number;
    verifiedQuantity: number;
    unit: QuantityUnit;
  }>;
}

export function aggregateStockByVarietyLocationUnit(records: StockView[]): VarietyLocationTotal[] {
  const groups = new Map<string, VarietyLocationTotal>();
  for (const record of records) {
    const unit = stockUnit(record);
    const key = `${record.locationId}:${record.lot.variety}:${unit}`;
    const current = groups.get(key) ?? {
      locationId: record.locationId,
      locationName: record.location.name,
      variety: record.lot.variety,
      unit,
      totalDeclared: 0,
      totalVerified: 0,
      lots: [],
    };
    current.totalDeclared += record.declaredQuantity;
    current.totalVerified += record.verifiedQuantity;
    current.lots.push({
      lotId: record.lotId,
      lotCode: record.lot.code,
      declaredQuantity: record.declaredQuantity,
      verifiedQuantity: record.verifiedQuantity,
      unit,
    });
    groups.set(key, current);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      lots: group.lots.sort((left, right) => left.lotCode.localeCompare(right.lotCode, 'es')),
    }))
    .sort((left, right) => (
      left.locationName.localeCompare(right.locationName, 'es')
      || left.variety.localeCompare(right.variety, 'es')
      || left.unit.localeCompare(right.unit)
    ));
}
