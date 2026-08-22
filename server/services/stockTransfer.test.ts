import { describe, expect, it } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { MovementIntent } from '../../src/types/domain';
import { buildStockTransferPreview } from './stockTransfer';

const snapshot: PapaStockSnapshot = {
  locations: [
    { id: 'central', name: 'Frigorífico Central', type: 'cold_storage' },
    { id: 'warehouse', name: 'Galpón Principal', type: 'warehouse' },
  ],
  lots: [
    { id: 'a310', code: 'A-310', variety: 'Innovator', campaign: '2025/26', producer: 'P', origin: 'Balcarce' },
    { id: 'a204', code: 'A-204', variety: 'Innovator', campaign: '2025/26', producer: 'P', origin: 'Balcarce' },
  ],
  stockRecords: [
    { id: 's310', lotId: 'a310', locationId: 'central', declaredQuantity: 22000, verifiedQuantity: 22000, updatedAt: 'x' },
    { id: 's204', lotId: 'a204', locationId: 'central', declaredQuantity: 25000, verifiedQuantity: 24000, updatedAt: 'x' },
  ],
  movements: [],
  traceabilityEvents: [],
};

const intent = (overrides: Partial<MovementIntent> = {}): MovementIntent => ({
  action: 'transfer', lotCode: 'A-310', quantityKg: 500,
  origin: 'Frigorífico Central', destination: 'Galpón Principal', ...overrides,
});

describe('validación determinística de movimientos N01', () => {
  it('aprueba una transferencia coherente sin modificar datos', () => {
    expect(buildStockTransferPreview(intent(), snapshot)).toMatchObject({ valid: true, errors: [], originStock: { verifiedQuantity: 22000 } });
  });

  it('bloquea el lote A-204 por discrepancia abierta', () => {
    const result = buildStockTransferPreview(intent({ lotCode: 'A-204' }), snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toContain('UNRESOLVED_DISCREPANCY');
  });

  it('bloquea stock insuficiente y ubicaciones iguales', () => {
    const insufficient = buildStockTransferPreview(intent({ quantityKg: 23000 }), snapshot);
    expect(insufficient.errors.map((item) => item.code)).toEqual(expect.arrayContaining(['INSUFFICIENT_VERIFIED_STOCK', 'INSUFFICIENT_DECLARED_STOCK']));

    expect(buildStockTransferPreview(intent({ destination: 'Frigorífico Central' }), snapshot).errors.map((item) => item.code)).toContain('SAME_LOCATION');
  });

  it('tolera nombres sin acentos pero no inventa entidades', () => {
    expect(buildStockTransferPreview(intent({ origin: 'Frigorifico Central', destination: 'Galpon Principal' }), snapshot).valid).toBe(true);
    expect(buildStockTransferPreview(intent({ destination: 'Puerto' }), snapshot).errors.map((item) => item.code)).toContain('DESTINATION_NOT_FOUND');
  });
});
