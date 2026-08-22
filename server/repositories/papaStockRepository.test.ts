import type pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { PapaStockRepository } from './papaStockRepository';

describe('PapaStockRepository', () => {
  it('proyecta un snapshot coherente desde cinco consultas', async () => {
    const responses = [
      { rowCount: 1, rows: [{ id: 'loc', name: 'Sur', type: 'cold_storage', created_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'lot', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'stock', lot_id: 'lot', location_id: 'loc', declared_quantity: '25000', verified_quantity: '24000', verification_pending: false, updated_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'move', reference: 'MV-1032', lot_id: 'lot', origin_location_id: null, destination_location_id: 'loc', quantity: '1000', movement_date: '2026-08-20', status: 'pending', created_at: 'x' }] },
      { rowCount: 0, rows: [] },
    ];
    const query = vi.fn(async () => responses.shift());
    const repository = new PapaStockRepository({ query } as unknown as pg.Pool);
    const result = await repository.loadSnapshot();

    expect(query).toHaveBeenCalledTimes(5);
    expect(result.stockRecords[0]).toMatchObject({ declaredQuantity: 25000, verifiedQuantity: 24000 });
    expect(result.movements[0]).toMatchObject({ reference: 'MV-1032', quantity: 1000 });
  });
});
