import type {
  MovementIntent,
  StockTransferPreview,
  ValidationError,
} from '../../src/types/domain';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';

const EPSILON = 0.001;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function buildStockTransferPreview(
  intent: MovementIntent,
  snapshot: PapaStockSnapshot,
): StockTransferPreview {
  const errors: ValidationError[] = [];
  const lot = snapshot.lots.find((item) => normalize(item.code) === normalize(intent.lotCode));
  const origin = snapshot.locations.find((item) =>
    normalize(item.id) === normalize(intent.origin) || normalize(item.name) === normalize(intent.origin));
  const destination = snapshot.locations.find((item) =>
    normalize(item.id) === normalize(intent.destination) || normalize(item.name) === normalize(intent.destination));

  if (!Number.isFinite(intent.quantityKg) || intent.quantityKg <= 0) {
    errors.push({ code: 'INVALID_QUANTITY', message: 'La cantidad debe ser mayor a cero.' });
  }
  if (!lot) errors.push({ code: 'LOT_NOT_FOUND', message: `No existe el lote ${intent.lotCode}.` });
  if (!origin) errors.push({ code: 'ORIGIN_NOT_FOUND', message: `No existe la ubicación de origen “${intent.origin}”.` });
  if (!destination) errors.push({ code: 'DESTINATION_NOT_FOUND', message: `No existe la ubicación de destino “${intent.destination}”.` });
  if (origin && destination && origin.id === destination.id) {
    errors.push({ code: 'SAME_LOCATION', message: 'El origen y el destino deben ser distintos.' });
  }

  const lotStock = lot ? snapshot.stockRecords.filter((item) => item.lotId === lot.id) : [];
  const originRecord = origin ? lotStock.find((item) => item.locationId === origin.id) : undefined;
  if (lot && origin && !originRecord) {
    errors.push({ code: 'ORIGIN_STOCK_NOT_FOUND', message: `El lote ${lot.code} no tiene stock registrado en ${origin.name}.` });
  }
  if (originRecord && intent.quantityKg > originRecord.verifiedQuantity + EPSILON) {
    errors.push({ code: 'INSUFFICIENT_VERIFIED_STOCK', message: 'La cantidad supera el stock verificado disponible en origen.' });
  }
  if (originRecord && intent.quantityKg > originRecord.declaredQuantity + EPSILON) {
    errors.push({ code: 'INSUFFICIENT_DECLARED_STOCK', message: 'La cantidad supera el stock declarado disponible en origen.' });
  }
  if (lotStock.some((item) => item.verificationPending
    || Math.abs(item.verifiedQuantity - item.declaredQuantity) > EPSILON)) {
    errors.push({ code: 'UNRESOLVED_DISCREPANCY', message: 'El lote presenta una discrepancia o verificación pendiente.' });
  }

  return {
    valid: errors.length === 0,
    errors,
    intent,
    lot,
    origin,
    destination,
    originStock: originRecord && {
      declaredQuantity: originRecord.declaredQuantity,
      verifiedQuantity: originRecord.verifiedQuantity,
    },
  };
}
