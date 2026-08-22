import { expandLegacyIntent, recordMatchesUnit, stockKey } from '../../src/lib/movements';
import { stockUnit } from '../../src/lib/quantity';
import type {
  MovementIntent,
  QuantityUnit,
  StockRecord,
  StockTransferLinePreview,
  StockTransferPreview,
  ValidationError,
} from '../../src/types/domain';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';

const EPSILON = 0.001;

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function cloneStock(record: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>) {
  return { declaredQuantity: record.declaredQuantity, verifiedQuantity: record.verifiedQuantity };
}

function emptyStock() {
  return { declaredQuantity: 0, verifiedQuantity: 0 };
}

export function buildStockTransferPreview(
  rawIntent: MovementIntent,
  snapshot: PapaStockSnapshot,
): StockTransferPreview {
  const intent = expandLegacyIntent(rawIntent);
  const errors: ValidationError[] = [];
  const origin = snapshot.locations.find((item) =>
    normalize(item.id) === normalize(intent.origin) || normalize(item.name) === normalize(intent.origin));
  const destination = snapshot.locations.find((item) =>
    normalize(item.id) === normalize(intent.destination) || normalize(item.name) === normalize(intent.destination));

  if (!intent.items.length) {
    errors.push({ code: 'EMPTY_ITEMS', message: 'El movimiento debe tener al menos una línea de lote.' });
  }
  if (!origin) errors.push({ code: 'ORIGIN_NOT_FOUND', message: `No existe la ubicación de origen “${intent.origin}”.` });
  if (!destination) errors.push({ code: 'DESTINATION_NOT_FOUND', message: `No existe la ubicación de destino “${intent.destination}”.` });
  if (origin && destination && origin.id === destination.id) {
    errors.push({ code: 'SAME_LOCATION', message: 'El origen y el destino deben ser distintos.' });
  }

  const simulated = new Map<string, { declaredQuantity: number; verifiedQuantity: number }>();
  for (const record of snapshot.stockRecords) {
    simulated.set(
      stockKey(record.lotId, record.locationId, stockUnit(record)),
      cloneStock(record),
    );
  }

  const lines: StockTransferLinePreview[] = [];

  for (const item of intent.items) {
    const lot = snapshot.lots.find((candidate) => normalize(candidate.code) === normalize(item.lotCode));
    const unit: QuantityUnit = item.unit;
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      errors.push({ code: 'INVALID_QUANTITY', message: `La cantidad del lote ${item.lotCode} debe ser mayor a cero.` });
    }
    if (!lot) errors.push({ code: 'LOT_NOT_FOUND', message: `No existe el lote ${item.lotCode}.` });
    if (unit !== 'kg' && unit !== 'bags') {
      errors.push({ code: 'INVALID_UNIT', message: `Unidad no soportada para el lote ${item.lotCode}.` });
    }

    const lotStock = lot ? snapshot.stockRecords.filter((record) => record.lotId === lot.id) : [];
    if (lotStock.some((record) => record.verificationPending
      || Math.abs(record.verifiedQuantity - record.declaredQuantity) > EPSILON)) {
      errors.push({
        code: 'UNRESOLVED_DISCREPANCY',
        message: `El lote ${lot?.code ?? item.lotCode} presenta una discrepancia o verificación pendiente.`,
      });
    }

    const originRecord = lot && origin
      ? lotStock.find((record) => record.locationId === origin.id && recordMatchesUnit(record, unit))
      : undefined;
    const destRecord = lot && destination
      ? lotStock.find((record) => record.locationId === destination.id && recordMatchesUnit(record, unit))
      : undefined;
    const otherUnitAtOrigin = lot && origin
      ? lotStock.find((record) => record.locationId === origin.id && !recordMatchesUnit(record, unit))
      : undefined;

    if (lot && origin && !originRecord && otherUnitAtOrigin) {
      errors.push({
        code: 'UNIT_MISMATCH',
        message: `El lote ${lot.code} en ${origin.name} está en ${stockUnit(otherUnitAtOrigin)}; no se convierte ${unit}.`,
      });
    } else if (lot && origin && !originRecord) {
      errors.push({
        code: 'ORIGIN_STOCK_NOT_FOUND',
        message: `El lote ${lot.code} no tiene stock registrado en ${origin.name} (${unit}).`,
      });
    }

    const originKey = lot && origin ? stockKey(lot.id, origin.id, unit) : '';
    const destKey = lot && destination ? stockKey(lot.id, destination.id, unit) : '';
    const originSim = originKey ? (simulated.get(originKey) ?? emptyStock()) : emptyStock();
    const destSim = destKey ? (simulated.get(destKey) ?? emptyStock()) : emptyStock();

    if (originRecord && item.quantity > originSim.verifiedQuantity + EPSILON) {
      errors.push({
        code: 'INSUFFICIENT_VERIFIED_STOCK',
        message: `El lote ${lot?.code ?? item.lotCode} no tiene stock verificado suficiente en origen.`,
      });
    }
    if (originRecord && item.quantity > originSim.declaredQuantity + EPSILON) {
      errors.push({
        code: 'INSUFFICIENT_DECLARED_STOCK',
        message: `El lote ${lot?.code ?? item.lotCode} no tiene stock declarado suficiente en origen.`,
      });
    }

    const originAfter = {
      declaredQuantity: originSim.declaredQuantity - item.quantity,
      verifiedQuantity: originSim.verifiedQuantity - item.quantity,
    };
    const destinationAfter = {
      declaredQuantity: destSim.declaredQuantity + item.quantity,
      verifiedQuantity: destSim.verifiedQuantity + item.quantity,
    };
    if (originKey) simulated.set(originKey, originAfter);
    if (destKey) simulated.set(destKey, destinationAfter);

    lines.push({
      lotCode: item.lotCode,
      quantity: item.quantity,
      unit,
      lot,
      originStock: originRecord && cloneStock(originSim),
      destinationStock: destRecord ? cloneStock(destSim) : emptyStock(),
      originAfter,
      destinationAfter,
    });
  }

  const uniqueCodes = new Set(errors.map((error) => `${error.code}:${error.message}`));
  const deduped = errors.filter((error, index) => {
    const key = `${error.code}:${error.message}`;
    return [...uniqueCodes].indexOf(key) === index;
  });

  return {
    valid: deduped.length === 0,
    errors: deduped,
    intent,
    remitoNumber: intent.remitoNumber,
    origin,
    destination,
    lines,
    lot: lines[0]?.lot,
    originStock: lines[0]?.originStock,
  };
}
