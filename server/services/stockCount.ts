import { recordMatchesUnit } from '../../src/lib/movements';
import { normalize } from './stockTransfer';
import type {
  Location,
  Lot,
  StockCount,
  StockCountInput,
  StockRecord,
  ValidationError,
} from '../../src/types/domain';

export interface StockCountPlan {
  valid: boolean;
  errors: ValidationError[];
  lot?: Lot;
  location?: Location;
  record?: StockRecord;
  expectedQuantity: number;
  observedQuantity: number;
  difference: number;
  count: Omit<StockCount, 'id' | 'discrepancyId'>;
}

export function buildStockCountPlan(
  input: StockCountInput,
  lots: Lot[],
  locations: Location[],
  stockRecords: StockRecord[],
): StockCountPlan {
  const errors: ValidationError[] = [];
  const lot = lots.find((item) => (
    (input.lotId && item.id === input.lotId)
    || (input.lotCode && item.code.toLowerCase() === input.lotCode.toLowerCase())
  ));
  const location = locations.find((item) => (
    (input.locationId && item.id === input.locationId)
    || (input.location && (normalize(item.id) === normalize(input.location) || normalize(item.name) === normalize(input.location)))
  ));

  if (!lot) errors.push({ code: 'LOT_NOT_FOUND', message: 'No existe el lote a contar.' });
  if (!location) errors.push({ code: 'LOCATION_NOT_FOUND', message: 'No existe la ubicación del conteo.' });
  if (!Number.isFinite(input.observedQuantity) || input.observedQuantity < 0) {
    errors.push({ code: 'INVALID_QUANTITY', message: 'La cantidad observada no puede ser negativa.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push({ code: 'INVALID_DATE', message: 'Ingresá la fecha del conteo.' });
  }

  const record = lot && location
    ? stockRecords.find((item) => item.lotId === lot.id && item.locationId === location.id && recordMatchesUnit(item, input.unit))
    : undefined;
  if (lot && location && !record) {
    errors.push({ code: 'STOCK_NOT_FOUND', message: `No hay stock ${input.unit} de ${lot.code} en ${location.name}.` });
  }

  const expectedQuantity = record?.verifiedQuantity ?? 0;
  const difference = input.observedQuantity - expectedQuantity;

  return {
    valid: errors.length === 0,
    errors,
    lot,
    location,
    record,
    expectedQuantity,
    observedQuantity: input.observedQuantity,
    difference,
    count: {
      locationId: location?.id ?? '',
      lotId: lot?.id ?? '',
      expectedQuantity,
      observedQuantity: input.observedQuantity,
      unit: input.unit,
      difference,
      countedAt: input.date,
      notes: input.notes,
    },
  };
}
