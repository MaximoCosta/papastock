import { createHash } from 'node:crypto';
import { movementItemsOf } from '../../src/lib/movements';
import type {
  Discrepancy,
  Movement,
  MovementItem,
  MovementReceptionInput,
  QuantityUnit,
  ValidationError,
} from '../../src/types/domain';

const EPSILON = 0.001;

export function receptionPayloadFingerprint(input: MovementReceptionInput): string {
  const normalized = {
    movementId: input.movementId,
    date: input.date,
    items: input.items
      ? [...input.items]
          .sort((left, right) => left.movementItemId.localeCompare(right.movementItemId))
          .map(({ movementItemId, receivedQuantity }) => ({ movementItemId, receivedQuantity }))
      : null,
    receivedTotal: input.receivedTotal ?? null,
    unit: input.unit ?? null,
  };
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export interface ReceptionPlan {
  valid: boolean;
  errors: ValidationError[];
  receptionStatus: Movement['receptionStatus'];
  receivedTotal?: number;
  receivedUnit?: QuantityUnit;
  itemUpdates: Array<{ item: MovementItem; receivedQuantity: number; difference: number }>;
  stockAdjustments: Array<{ lotId: string; unit: QuantityUnit; deltaVerified: number }>;
  discrepancies: Array<Omit<Discrepancy, 'id' | 'createdAt'>>;
}

export function buildReceptionPlan(movement: Movement, input: MovementReceptionInput): ReceptionPlan {
  const errors: ValidationError[] = [];
  const items = movementItemsOf(movement);
  if (items.length === 0) {
    errors.push({ code: 'NO_ITEMS', message: 'El movimiento no tiene líneas para recepcionar.' });
  }
  if (movement.kind === 'correction') {
    errors.push({ code: 'NOT_RECEIVABLE', message: 'Una corrección no se recepciona.' });
  }
  if (movement.receptionStatus !== 'pending') {
    errors.push({ code: 'RECEPTION_TERMINAL', message: 'El movimiento ya no admite una recepción inicial.' });
  }

  const itemUpdates: ReceptionPlan['itemUpdates'] = [];
  const stockAdjustments: ReceptionPlan['stockAdjustments'] = [];
  const discrepancies: ReceptionPlan['discrepancies'] = [];

  if (input.items?.length) {
    for (const line of input.items) {
      const item = items.find((candidate) => candidate.id === line.movementItemId);
      if (!item) {
        errors.push({ code: 'ITEM_NOT_FOUND', message: `No existe la línea ${line.movementItemId}.` });
        continue;
      }
      if (!Number.isFinite(line.receivedQuantity) || line.receivedQuantity < 0) {
        errors.push({ code: 'INVALID_QUANTITY', message: 'La cantidad recibida no puede ser negativa.' });
        continue;
      }
      const difference = line.receivedQuantity - item.dispatchedQuantity;
      itemUpdates.push({ item, receivedQuantity: line.receivedQuantity, difference });
      if (Math.abs(difference) > EPSILON) {
        stockAdjustments.push({ lotId: item.lotId, unit: item.unit, deltaVerified: difference });
        discrepancies.push({
          movementId: movement.id,
          movementItemId: item.id,
          lotId: item.lotId,
          locationId: movement.destinationLocationId,
          type: 'reception_shortfall',
          expectedQuantity: item.dispatchedQuantity,
          observedQuantity: line.receivedQuantity,
          unit: item.unit,
          difference,
          status: 'open',
        });
      }
    }
    const missing = items.filter((item) => !input.items?.some((line) => line.movementItemId === item.id));
    if (missing.length) {
      errors.push({ code: 'INCOMPLETE_LINES', message: 'Si informás recepción por línea, tenés que cubrir todas las líneas.' });
    }
    return {
      valid: errors.length === 0,
      errors,
      receptionStatus: discrepancies.length ? 'received' : 'received',
      itemUpdates,
      stockAdjustments,
      discrepancies,
    };
  }

  if (input.receivedTotal === undefined) {
    errors.push({ code: 'MISSING_RECEPTION', message: 'Informá el total recibido o las cantidades por línea.' });
    return { valid: false, errors, receptionStatus: 'pending', itemUpdates, stockAdjustments, discrepancies };
  }

  const units = new Set(items.map((item) => item.unit));
  const unit = input.unit ?? (units.size === 1 ? items[0]?.unit : undefined);
  if (!unit || (units.size === 1 && unit !== items[0]?.unit)) {
    errors.push({ code: 'UNIT_REQUIRED', message: 'La recepción total necesita la misma unidad que el despacho.' });
  }
  if (units.size > 1) {
    errors.push({ code: 'MIXED_UNITS', message: 'Hay unidades distintas: no se puede recepcionar solo un total.' });
  }
  const dispatchedTotal = items.reduce((total, item) => total + item.dispatchedQuantity, 0);
  const difference = input.receivedTotal - dispatchedTotal;
  if (Math.abs(difference) > EPSILON) {
    discrepancies.push({
      movementId: movement.id,
      locationId: movement.destinationLocationId,
      type: 'reception_unallocated',
      expectedQuantity: dispatchedTotal,
      observedQuantity: input.receivedTotal,
      unit: unit ?? 'bags',
      difference,
      status: 'open',
      cause: 'Se conoce el total recibido pero no cómo se reparte entre lotes. No se inventa la distribución.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    receptionStatus: Math.abs(difference) > EPSILON ? 'needs_reconciliation' : 'received',
    receivedTotal: input.receivedTotal,
    receivedUnit: unit,
    itemUpdates,
    stockAdjustments,
    discrepancies,
  };
}
