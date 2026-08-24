import { describe, expect, it } from 'vitest';
import { getPriorityStockViewByLotId, getStockViewsByLotId } from './stockService';
import type { StockView } from '../types/domain';

const lot = {
  id: 'lot-showcase-001',
  code: 'SHOW-001',
  variety: 'Spunta',
  campaign: '2025/26',
  producer: 'Papasud',
  origin: 'Balcarce',
};

function stock(id: string, status: StockView['status']): StockView {
  return {
    id,
    lotId: lot.id,
    locationId: `location-${id}`,
    declaredQuantity: 100,
    verifiedQuantity: status === 'discrepancy' ? 90 : 100,
    verificationPending: status === 'pending',
    updatedAt: '2026-08-24T00:00:00.000Z',
    lot,
    location: { id: `location-${id}`, name: id, type: 'warehouse' },
    difference: status === 'discrepancy' ? -10 : 0,
    status,
  };
}

describe('stock por lote', () => {
  it('conserva todas las ubicaciones y prioriza una discrepancia para el resumen', () => {
    const records = [
      stock('frigorifico', 'verified'),
      stock('pendiente', 'pending'),
      stock('campo', 'discrepancy'),
    ];

    expect(getStockViewsByLotId(records, lot.id)).toHaveLength(3);
    expect(getPriorityStockViewByLotId(records, lot.id)?.id).toBe('campo');
  });

  it('prioriza una verificación pendiente cuando no hay discrepancias', () => {
    const records = [stock('frigorifico', 'verified'), stock('campo', 'pending')];

    expect(getPriorityStockViewByLotId(records, lot.id)?.id).toBe('campo');
  });

  it('usa un registro conciliado cuando no hay discrepancias ni verificaciones pendientes', () => {
    const records = [stock('frigorifico', 'verified'), stock('campo', 'verified')];

    expect(getPriorityStockViewByLotId(records, lot.id)?.id).toBe('frigorifico');
  });
});
