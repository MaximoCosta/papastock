import { describe, expect, it } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { MovementIntent } from '../../src/types/domain';
import { buildStockTransferPreview } from './stockTransfer';

const snapshot: PapaStockSnapshot = {
  locations: [
    { id: 'central', name: 'Frigorífico Central', type: 'cold_storage' },
    { id: 'warehouse', name: 'Galpón Principal', type: 'warehouse' },
    { id: 'oriente', name: 'Campo Oriente', type: 'warehouse' },
    { id: 'friga', name: 'Frigorífico A', type: 'cold_storage' },
  ],
  shelfUnits: [],
  shelves: [],
  lots: [
    { id: 'a310', code: 'A-310', variety: 'Innovator', campaign: '2025/26', producer: 'P', origin: 'Balcarce' },
    { id: 'a204', code: 'A-204', variety: 'Innovator', campaign: '2025/26', producer: 'P', origin: 'Balcarce' },
    { id: 'l300', code: '300', variety: 'Spunta', campaign: '2025/26', producer: 'P', origin: 'Balcarce' },
    { id: 'l301', code: '301', variety: 'Spunta', campaign: '2025/26', producer: 'P', origin: 'Balcarce' },
  ],
  stockRecords: [
    { id: 's310', lotId: 'a310', locationId: 'central', declaredQuantity: 22000, verifiedQuantity: 22000, updatedAt: 'x', unit: 'kg' },
    { id: 's204', lotId: 'a204', locationId: 'central', declaredQuantity: 25000, verifiedQuantity: 24000, updatedAt: 'x', unit: 'kg' },
    { id: 's300', lotId: 'l300', locationId: 'oriente', declaredQuantity: 500, verifiedQuantity: 500, updatedAt: 'x', unit: 'bags' },
    { id: 's301', lotId: 'l301', locationId: 'oriente', declaredQuantity: 300, verifiedQuantity: 300, updatedAt: 'x', unit: 'bags' },
  ],
  movements: [],
  transporters: [],
  traceabilityEvents: [],
};

const intent = (overrides: Partial<MovementIntent> = {}): MovementIntent => ({
  action: 'transfer',
  lotCode: 'A-310',
  quantityKg: 500,
  origin: 'Frigorífico Central',
  destination: 'Galpón Principal',
  items: [{ lotCode: 'A-310', quantity: 500, unit: 'kg' }],
  ...overrides,
});

describe('validación determinística de movimientos N01', () => {
  it('aprueba una transferencia coherente sin modificar datos', () => {
    expect(buildStockTransferPreview(intent(), snapshot)).toMatchObject({ valid: true, errors: [], originStock: { verifiedQuantity: 22000 } });
  });

  it('bloquea el lote A-204 por discrepancia abierta', () => {
    const result = buildStockTransferPreview(intent({
      lotCode: 'A-204',
      items: [{ lotCode: 'A-204', quantity: 500, unit: 'kg' }],
    }), snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toContain('UNRESOLVED_DISCREPANCY');
  });

  it('bloquea stock insuficiente y ubicaciones iguales', () => {
    const insufficient = buildStockTransferPreview(intent({
      quantityKg: 23000,
      items: [{ lotCode: 'A-310', quantity: 23000, unit: 'kg' }],
    }), snapshot);
    expect(insufficient.errors.map((item) => item.code)).toEqual(expect.arrayContaining(['INSUFFICIENT_VERIFIED_STOCK', 'INSUFFICIENT_DECLARED_STOCK']));

    expect(buildStockTransferPreview(intent({ destination: 'Frigorífico Central' }), snapshot).errors.map((item) => item.code)).toContain('SAME_LOCATION');
  });

  it('tolera nombres sin acentos pero no inventa entidades', () => {
    expect(buildStockTransferPreview(intent({ origin: 'Frigorifico Central', destination: 'Galpon Principal' }), snapshot).valid).toBe(true);
    expect(buildStockTransferPreview(intent({ destination: 'Puerto' }), snapshot).errors.map((item) => item.code)).toContain('DESTINATION_NOT_FOUND');
  });

  it('TEST A: preview multi-lote con dos líneas independientes', () => {
    const result = buildStockTransferPreview({
      action: 'transfer',
      remitoNumber: '315',
      origin: 'Campo Oriente',
      destination: 'Frigorífico A',
      items: [
        { lotCode: '300', quantity: 400, unit: 'bags' },
        { lotCode: '301', quantity: 200, unit: 'bags' },
      ],
    }, snapshot);
    expect(result.valid).toBe(true);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({
      lotCode: '300',
      originAfter: { verifiedQuantity: 100 },
      destinationAfter: { verifiedQuantity: 400 },
    });
    expect(result.lines[1]).toMatchObject({
      lotCode: '301',
      originAfter: { verifiedQuantity: 100 },
      destinationAfter: { verifiedQuantity: 200 },
    });
  });

  it('TEST B: si un lote no alcanza, falla todo el preview', () => {
    const result = buildStockTransferPreview({
      action: 'transfer',
      remitoNumber: '315',
      origin: 'Campo Oriente',
      destination: 'Frigorífico A',
      items: [
        { lotCode: '300', quantity: 400, unit: 'bags' },
        { lotCode: '301', quantity: 200, unit: 'bags' },
      ],
    }, {
      ...snapshot,
      stockRecords: snapshot.stockRecords.map((record) => (
        record.id === 's301' ? { ...record, declaredQuantity: 100, verifiedQuantity: 100 } : record
      )),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toEqual(expect.arrayContaining([
      'INSUFFICIENT_VERIFIED_STOCK',
      'INSUFFICIENT_DECLARED_STOCK',
    ]));
  });

  it('TEST G: no permite dejar stock negativo aunque se llame directo', () => {
    const result = buildStockTransferPreview({
      action: 'transfer',
      origin: 'Campo Oriente',
      destination: 'Frigorífico A',
      items: [{ lotCode: '300', quantity: 700, unit: 'bags' }],
    }, snapshot);
    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toContain('INSUFFICIENT_VERIFIED_STOCK');
  });

  it('no convierte bolsas a kilos', () => {
    const result = buildStockTransferPreview({
      action: 'transfer',
      origin: 'Frigorífico Central',
      destination: 'Galpón Principal',
      items: [{ lotCode: 'A-310', quantity: 400, unit: 'bags' }],
    }, snapshot);
    expect(result.errors.map((item) => item.code)).toContain('UNIT_MISMATCH');
  });
});
