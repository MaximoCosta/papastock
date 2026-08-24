import { describe, expect, it } from 'vitest';
import type { MovementItemRow, MovementRow, StockRecordRow } from '../../src/types/database';
import { planLegacyMovementItems } from './legacyMovementItems';

function movement(overrides: Partial<MovementRow> = {}): MovementRow {
  return {
    id: 'movement-legacy', reference: 'MV-LEGACY', lot_id: 'lot-a', origin_location_id: 'origin',
    destination_location_id: 'destination', quantity: '10', movement_date: '2026-08-23', status: 'completed',
    created_at: '2026-08-23', kind: 'transfer', reception_status: 'not_applicable', data: {},
    ...overrides,
  };
}

function stock(unit: 'kg' | 'bags' = 'kg'): StockRecordRow {
  return {
    id: 'stock', lot_id: 'lot-a', location_id: 'destination', declared_quantity: '10', verified_quantity: '10',
    verification_pending: false, updated_at: '2026-08-23', unit,
  };
}

describe('plan de materialización legacy', () => {
  it('materializa transfer/import inequívocos e infiere una única unidad', () => {
    const plan = planLegacyMovementItems([movement(), movement({ id: 'movement-import', reference: 'IMP', kind: 'import' })], [], [stock()]);
    expect(plan.blocked).toEqual([]);
    expect(plan.materializable).toEqual([
      { movementId: 'movement-legacy', itemId: 'mitem-movement-legacy', lotId: 'lot-a', quantity: 10, unit: 'kg' },
      { movementId: 'movement-import', itemId: 'mitem-movement-import', lotId: 'lot-a', quantity: 10, unit: 'kg' },
    ]);
  });

  it('es idempotente cuando el movimiento ya tiene un item', () => {
    const item = { id: 'existing', movement_id: 'movement-legacy' } as MovementItemRow;
    expect(planLegacyMovementItems([movement()], [item], [stock()])).toEqual({ materializable: [], blocked: [] });
  });

  it.each([
    [movement({ kind: 'correction' }), 'kind correction'],
    [movement({ lot_id: null }), 'lot_id es NULL'],
    [movement({ quantity: null }), 'quantity no es positiva'],
    [movement({ origin_location_id: 'origin', destination_location_id: 'origin' }), 'endpoints ambiguos'],
  ])('bloquea semántica ambigua: %s', (candidate, reason) => {
    const plan = planLegacyMovementItems([candidate], [], [stock()]);
    expect(plan.materializable).toEqual([]);
    expect(plan.blocked[0].reason).toContain(reason);
  });

  it('bloquea cuando kg/bags no puede inferirse con certeza', () => {
    const plan = planLegacyMovementItems([movement()], [], [stock('kg'), { ...stock('bags'), id: 'stock-bags' }]);
    expect(plan.materializable).toEqual([]);
    expect(plan.blocked[0].reason).toContain('unidad no inferible');
  });
});
