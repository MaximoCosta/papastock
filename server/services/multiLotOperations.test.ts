import { describe, expect, it } from 'vitest';
import type { Movement } from '../../src/types/domain';
import { buildLotCorrectionPlan } from './lotCorrection';
import { buildReceptionPlan, receptionPayloadFingerprint } from './movementReception';
import { buildStockCountPlan } from './stockCount';

const movement: Movement = {
  id: 'mv-315',
  reference: 'MV-N01-315',
  remitoNumber: '315',
  originLocationId: 'loc-oriente',
  destinationLocationId: 'loc-frig-a',
  date: '2026-08-22',
  status: 'completed',
  kind: 'transfer',
  receptionStatus: 'pending',
  items: [
    { id: 'i1', movementId: 'mv-315', lotId: 'lot-300', dispatchedQuantity: 400, unit: 'bags', sortOrder: 0 },
    { id: 'i2', movementId: 'mv-315', lotId: 'lot-301', dispatchedQuantity: 200, unit: 'bags', sortOrder: 1 },
  ],
};

describe('TEST D — recepción 600 → 595', () => {
  it('conserva despachado y crea discrepancia sin inventar el reparto', () => {
    const plan = buildReceptionPlan(movement, {
      movementId: 'mv-315',
      idempotencyKey: 'receipt-test-total-0001',
      date: '2026-08-22',
      receivedTotal: 595,
      unit: 'bags',
    });
    expect(plan.valid).toBe(true);
    expect(plan.receptionStatus).toBe('needs_reconciliation');
    expect(plan.receivedTotal).toBe(595);
    expect(plan.itemUpdates).toHaveLength(0);
    expect(plan.discrepancies).toEqual([expect.objectContaining({
      type: 'reception_unallocated',
      expectedQuantity: 600,
      observedQuantity: 595,
      difference: -5,
      unit: 'bags',
    })]);
  });

  it('si hay líneas, conserva despachado y observa recibido por lote', () => {
    const plan = buildReceptionPlan(movement, {
      movementId: 'mv-315',
      idempotencyKey: 'receipt-test-lines-0001',
      date: '2026-08-22',
      items: [
        { movementItemId: 'i1', receivedQuantity: 397 },
        { movementItemId: 'i2', receivedQuantity: 198 },
      ],
    });
    expect(plan.valid).toBe(true);
    expect(plan.itemUpdates[0]).toMatchObject({ receivedQuantity: 397, difference: -3 });
    expect(plan.discrepancies).toHaveLength(2);
  });

  it('normaliza el orden de líneas para un fingerprint idempotente estable', () => {
    const base = {
      movementId: 'mv-315', idempotencyKey: 'receipt-fingerprint-01', date: '2026-08-22',
    };
    expect(receptionPayloadFingerprint({
      ...base,
      items: [
        { movementItemId: 'i2', receivedQuantity: 198 },
        { movementItemId: 'i1', receivedQuantity: 397 },
      ],
    })).toBe(receptionPayloadFingerprint({
      ...base,
      items: [
        { movementItemId: 'i1', receivedQuantity: 397 },
        { movementItemId: 'i2', receivedQuantity: 198 },
      ],
    }));
  });

  it('rechaza planificar una recepción sobre un estado terminal', () => {
    const plan = buildReceptionPlan({ ...movement, receptionStatus: 'received' }, {
      movementId: 'mv-315', idempotencyKey: 'receipt-terminal-0001', date: '2026-08-22', receivedTotal: 600, unit: 'bags',
    });
    expect(plan.valid).toBe(false);
    expect(plan.errors).toContainEqual(expect.objectContaining({ code: 'RECEPTION_TERMINAL' }));
  });
});

describe('TEST E — corrección de lote mal imputado', () => {
  it('valida reasignar 200 de 300 hacia 301 sin borrar el original', () => {
    const plan = buildLotCorrectionPlan(
      {
        originalMovementId: 'mv-315',
        locationId: 'loc-oriente',
        fromLotCode: '300',
        toLotCode: '301',
        quantity: 200,
        unit: 'bags',
      },
      movement,
      [
        { id: 'lot-300', code: '300', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O' },
        { id: 'lot-301', code: '301', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O' },
      ],
      [
        { id: 's300', lotId: 'lot-300', locationId: 'loc-oriente', declaredQuantity: 100, verifiedQuantity: 100, updatedAt: 'x', unit: 'bags' },
        { id: 's301', lotId: 'lot-301', locationId: 'loc-oriente', declaredQuantity: 300, verifiedQuantity: 300, updatedAt: 'x', unit: 'bags' },
      ],
    );
    expect(plan.valid).toBe(true);
    expect(plan.fromLot?.code).toBe('300');
    expect(plan.toLot?.code).toBe('301');
  });
});

describe('TEST F — conteo físico', () => {
  it('conserva esperado 900 y observado 880 con diferencia -20', () => {
    const plan = buildStockCountPlan(
      { lotCode: '300', location: 'Frigorífico A', observedQuantity: 880, unit: 'bags', date: '2026-08-22' },
      [{ id: 'lot-300', code: '300', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O' }],
      [{ id: 'loc-frig-a', name: 'Frigorífico A', type: 'cold_storage' }],
      [{ id: 's', lotId: 'lot-300', locationId: 'loc-frig-a', declaredQuantity: 900, verifiedQuantity: 900, updatedAt: 'x', unit: 'bags' }],
    );
    expect(plan.valid).toBe(true);
    expect(plan.expectedQuantity).toBe(900);
    expect(plan.observedQuantity).toBe(880);
    expect(plan.difference).toBe(-20);
  });
});
