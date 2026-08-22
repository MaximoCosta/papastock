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

  it('confirma una transferencia dentro de BEGIN/COMMIT y actualiza ambos extremos', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [] };
      if (sql.includes('from public.locations')) return { rows: [
        { id: 'central', name: 'Frigorífico Central', type: 'cold_storage', created_at: 'x' },
        { id: 'warehouse', name: 'Galpón Principal', type: 'warehouse', created_at: 'x' },
      ] };
      if (sql.includes('from public.lots')) return { rows: [{ id: 'lot', code: 'A-310', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' }] };
      if (sql.includes('from public.stock_records')) return { rows: [{ id: 'stock', lot_id: 'lot', location_id: 'central', declared_quantity: '22000', verified_quantity: '22000', verification_pending: false, updated_at: 'x' }] };
      if (sql.includes('insert into public.movements')) return { rows: [{ id: 'move', reference: 'MV-N01-TEST', lot_id: 'lot', origin_location_id: 'central', destination_location_id: 'warehouse', quantity: '500', movement_date: '2026-08-22', status: 'completed', created_at: 'x' }] };
      return { rows: [] };
    });
    const release = vi.fn();
    const repository = new PapaStockRepository({ connect: async () => ({ query, release }) } as unknown as pg.Pool);

    const result = await repository.executeStockTransfer({ action: 'transfer', lotCode: 'A-310', quantityKg: 500, origin: 'Frigorífico Central', destination: 'Galpón Principal' });

    expect(result).toMatchObject({ status: 'completed', quantity: 500 });
    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('update public.stock_records'))).toBe(true);
    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('insert into public.stock_records'))).toBe(true);
    expect(query).toHaveBeenCalledWith('commit');
    expect(release).toHaveBeenCalledOnce();
  });

  it('hace rollback si la validación cambió antes de confirmar', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [] };
      if (sql.includes('from public.locations')) return { rows: [
        { id: 'central', name: 'Frigorífico Central', type: 'cold_storage', created_at: 'x' },
        { id: 'warehouse', name: 'Galpón Principal', type: 'warehouse', created_at: 'x' },
      ] };
      if (sql.includes('from public.lots')) return { rows: [{ id: 'lot', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' }] };
      if (sql.includes('from public.stock_records')) return { rows: [{ id: 'stock', lot_id: 'lot', location_id: 'central', declared_quantity: '25000', verified_quantity: '24000', verification_pending: false, updated_at: 'x' }] };
      return { rows: [] };
    });
    const repository = new PapaStockRepository({ connect: async () => ({ query, release: vi.fn() }) } as unknown as pg.Pool);

    await expect(repository.executeStockTransfer({ action: 'transfer', lotCode: 'A-204', quantityKg: 500, origin: 'Frigorífico Central', destination: 'Galpón Principal' })).rejects.toMatchObject({ status: 409 });
    expect(query).toHaveBeenCalledWith('rollback');
    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('update public.stock_records'))).toBe(false);
  });

  it('importa la planilla sin mutar el stock protegido de A-204', async () => {
    const query = vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [], rowCount: 0 };
      if (sql.includes('from public.locations') && sql.includes('for update')) {
        return { rows: [
          { id: 'loc-south', name: 'Frigorífico Sur', type: 'cold_storage', created_at: 'x' },
          { id: 'loc-warehouse', name: 'Galpón Principal', type: 'warehouse', created_at: 'x' },
        ], rowCount: 2 };
      }
      if (sql.startsWith('select * from public.locations')) {
        return { rows: [
          { id: 'loc-south', name: 'Frigorífico Sur', type: 'cold_storage', created_at: 'x' },
          { id: 'loc-warehouse', name: 'Galpón Principal', type: 'warehouse', created_at: 'x' },
          { id: 'loc-imp-campo', name: 'Campo', type: 'warehouse', created_at: 'x' },
          { id: 'loc-imp-dos-panca', name: 'Dos Panca', type: 'cold_storage', created_at: 'x' },
        ], rowCount: 4 };
      }
      if (sql.includes('from public.lots') && sql.includes('for update')) {
        return { rows: [{ id: 'lot-a204', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' }], rowCount: 1 };
      }
      if (sql.startsWith('select * from public.lots')) {
        return { rows: [
          { id: 'lot-a204', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
          { id: 'lot-imp-241', code: '241', variety: 'Agata', campaign: '2026', producer: 'Papasud', origin: 'Balcarce', harvest_date: '2026-03-09', created_at: 'x' },
        ], rowCount: 2 };
      }
      if (sql.startsWith('insert into public.movements')) return { rows: [], rowCount: 1 };
      if (sql.includes('from public.movements where lot_id')) {
        expect(params?.[0]).toBe('lot-imp-241');
        return { rows: [{
          id: 'mov', reference: 'IMP-1', lot_id: 'lot-imp-241', origin_location_id: 'loc-imp-campo',
          destination_location_id: 'loc-imp-dos-panca', quantity: '35160', movement_date: '2026-03-09',
          status: 'completed', created_at: 'x', data: {},
        }], rowCount: 1 };
      }
      if (sql.startsWith('insert into public.stock_records')) {
        expect(params?.[1]).toBe('lot-imp-241');
        expect(params?.[1]).not.toBe('lot-a204');
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });
    const repository = new PapaStockRepository({ connect: async () => ({ query, release: vi.fn() }) } as unknown as pg.Pool);
    const result = await repository.executePlanillaImport({
      preview: {
        fileName: 'planilla.xlsx', movementCount: 1, totalKg: 35160, sample: [], sheets: [], skippedSheets: [],
        issues: [], newLocations: [], newLots: [], existingLocations: [], existingLots: [], valid: true,
      },
      locationsToCreate: [
        { id: 'loc-imp-campo', name: 'Campo', type: 'warehouse' },
        { id: 'loc-imp-dos-panca', name: 'Dos Panca', type: 'cold_storage' },
      ],
      lotsToCreate: [{
        id: 'lot-imp-241', code: '241', variety: 'Agata', campaign: '2026',
        producer: 'Papasud', origin: 'Balcarce', harvestDate: '2026-03-09',
      }],
      movementsToInsert: [{
        id: 'mov-imp-1', reference: 'IMP-1', lotCode: '241', originName: 'Campo',
        destinationName: 'Dos Panca', quantityKg: 35160, date: '2026-03-09',
        data: { source: 'planilla', sheet: 'De campo a Frío' },
      }],
      stockLotCodes: ['241'],
    });

    expect(result.createdMovements).toBe(1);
    expect(query.mock.calls.some((call) => String(call[0]).includes('stock_records') && call[1]?.includes('lot-a204'))).toBe(false);
    expect(query).toHaveBeenCalledWith('commit');
  });
});
