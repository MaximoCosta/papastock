import type { QuantityUnit } from '../types/domain';

export const QUANTITY_UNITS: QuantityUnit[] = ['kg', 'bags'];

export function normalizeUnit(value: string | null | undefined): QuantityUnit | undefined {
  const normalized = value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(normalized)) return 'kg';
  if (['bag', 'bags', 'bolsa', 'bolsas'].includes(normalized)) return 'bags';
  return undefined;
}

export function unitLabel(unit: QuantityUnit, quantity = 0): string {
  if (unit === 'bags') return Math.abs(quantity) === 1 ? 'bolsa' : 'bolsas';
  return 'kg';
}

export function formatQuantity(quantity: number, unit: QuantityUnit = 'kg'): string {
  const formatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(quantity);
  return `${formatted} ${unitLabel(unit, quantity)}`;
}

export function stockUnit(record: { unit?: QuantityUnit | null } | undefined): QuantityUnit {
  return record?.unit === 'bags' ? 'bags' : 'kg';
}
