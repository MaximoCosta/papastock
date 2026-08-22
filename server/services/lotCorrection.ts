import { movementItemsOf } from '../../src/lib/movements';
import { recordMatchesUnit } from '../../src/lib/movements';
import type {
  Lot,
  LotReallocationInput,
  Movement,
  StockRecord,
  ValidationError,
} from '../../src/types/domain';

const EPSILON = 0.001;

export interface LotCorrectionPlan {
  valid: boolean;
  errors: ValidationError[];
  fromLot?: Lot;
  toLot?: Lot;
  locationId: string;
  quantity: number;
  unit: LotReallocationInput['unit'];
}

export function buildLotCorrectionPlan(
  input: LotReallocationInput,
  original: Movement,
  lots: Lot[],
  stockRecords: StockRecord[],
): LotCorrectionPlan {
  const errors: ValidationError[] = [];
  const fromLot = lots.find((lot) => lot.code.toLowerCase() === input.fromLotCode.toLowerCase());
  const toLot = lots.find((lot) => lot.code.toLowerCase() === input.toLotCode.toLowerCase());

  if (!fromLot) errors.push({ code: 'LOT_NOT_FOUND', message: `No existe el lote ${input.fromLotCode}.` });
  if (!toLot) errors.push({ code: 'LOT_NOT_FOUND', message: `No existe el lote ${input.toLotCode}.` });
  if (fromLot && toLot && fromLot.id === toLot.id) {
    errors.push({ code: 'SAME_LOT', message: 'La corrección tiene que reasignar entre dos lotes distintos.' });
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    errors.push({ code: 'INVALID_QUANTITY', message: 'La cantidad a reasignar debe ser mayor a cero.' });
  }
  if (original.kind === 'correction') {
    errors.push({ code: 'ALREADY_CORRECTION', message: 'No se corrige una corrección. Referenciá el movimiento original.' });
  }

  const originalItems = movementItemsOf(original);
  if (fromLot && !originalItems.some((item) => item.lotId === fromLot.id)) {
    errors.push({ code: 'LOT_NOT_IN_MOVEMENT', message: `El lote ${fromLot.code} no participa del movimiento original.` });
  }

  const toStock = toLot
    ? stockRecords.find((record) => (
      record.lotId === toLot.id
      && record.locationId === input.locationId
      && recordMatchesUnit(record, input.unit)
    ))
    : undefined;
  if (toLot && !toStock) {
    errors.push({
      code: 'ORIGIN_STOCK_NOT_FOUND',
      message: `El lote ${toLot.code} no tiene stock ${input.unit} en la ubicación de la corrección.`,
    });
  }
  if (toStock && input.quantity > toStock.verifiedQuantity + EPSILON) {
    errors.push({ code: 'INSUFFICIENT_VERIFIED_STOCK', message: 'No hay stock verificado suficiente para reasignar.' });
  }
  if (toStock && input.quantity > toStock.declaredQuantity + EPSILON) {
    errors.push({ code: 'INSUFFICIENT_DECLARED_STOCK', message: 'No hay stock declarado suficiente para reasignar.' });
  }

  return {
    valid: errors.length === 0,
    errors,
    fromLot,
    toLot,
    locationId: input.locationId,
    quantity: input.quantity,
    unit: input.unit,
  };
}
