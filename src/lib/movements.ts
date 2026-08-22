import type { Movement, MovementIntent, MovementIntentItem, MovementItem, QuantityUnit } from '../types/domain';
import { stockUnit } from './quantity';

export function movementItemsOf(movement: Movement): MovementItem[] {
  if (movement.items && movement.items.length > 0) return movement.items;
  if (movement.lotId && movement.quantity && movement.quantity > 0) {
    return [{
      id: `${movement.id}-legacy`,
      movementId: movement.id,
      lotId: movement.lotId,
      dispatchedQuantity: movement.quantity,
      unit: 'kg',
      sortOrder: 0,
    }];
  }
  return [];
}

export function movementTouchesLot(movement: Movement, lotId: string): boolean {
  if (movement.lotId === lotId) return true;
  return movementItemsOf(movement).some((item) => item.lotId === lotId);
}

export function movementQuantityForLot(movement: Movement, lotId?: string): number {
  const items = movementItemsOf(movement);
  if (!lotId) {
    if (items.length === 0) return Number(movement.quantity ?? 0);
    const units = new Set(items.map((item) => item.unit));
    if (units.size !== 1) return Number(movement.quantity ?? items[0]?.dispatchedQuantity ?? 0);
    return items.reduce((total, item) => total + item.dispatchedQuantity, 0);
  }
  return items
    .filter((item) => item.lotId === lotId)
    .reduce((total, item) => total + item.dispatchedQuantity, 0);
}

export function movementPrimaryLotId(movement: Movement): string {
  return movement.lotId ?? movementItemsOf(movement)[0]?.lotId ?? '';
}

export function movementPrimaryUnit(movement: Movement): QuantityUnit {
  return movementItemsOf(movement)[0]?.unit ?? 'kg';
}

export function expandLegacyIntent(intent: MovementIntent): MovementIntent {
  if (intent.items?.length) {
    return {
      ...intent,
      action: 'transfer',
      items: intent.items.map((item) => ({
        lotCode: item.lotCode.trim(),
        quantity: item.quantity,
        unit: item.unit,
      })),
      lotCode: intent.items[0]?.lotCode,
      quantityKg: intent.items.length === 1 && intent.items[0]?.unit === 'kg'
        ? intent.items[0].quantity
        : undefined,
    };
  }
  if (intent.lotCode && intent.quantityKg && intent.quantityKg > 0) {
    const items: MovementIntentItem[] = [{
      lotCode: intent.lotCode,
      quantity: intent.quantityKg,
      unit: 'kg',
    }];
    return { ...intent, action: 'transfer', items };
  }
  return { ...intent, action: 'transfer', items: intent.items ?? [] };
}

export function stockKey(lotId: string, locationId: string, unit: QuantityUnit): string {
  return `${lotId}:${locationId}:${unit}`;
}

export function recordMatchesUnit(record: { unit?: QuantityUnit | null }, unit: QuantityUnit): boolean {
  return stockUnit(record) === unit;
}
