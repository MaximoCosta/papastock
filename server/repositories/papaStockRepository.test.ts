import type pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { PapaStockRepository } from './papaStockRepository';

describe('PapaStockRepository', () => {
  it('proyecta un snapshot coherente en una transacción read-only', async () => {
    const responses = [
      { rowCount: 1, rows: [{ id: 'loc', name: 'Sur', type: 'cold_storage', created_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'lot', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'stock', lot_id: 'lot', location_id: 'loc', declared_quantity: '25000', verified_quantity: '24000', verification_pending: false, updated_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'move', reference: 'MV-1032', lot_id: 'lot', origin_location_id: null, destination_location_id: 'loc', quantity: '1000', movement_date: '2026-08-20', status: 'pending', created_at: 'x' }] },
      { rowCount: 1, rows: [{ id: 'mitem-move', movement_id: 'move', lot_id: 'lot', dispatched_quantity: '1000', received_quantity: null, received_at: null, unit: 'kg', sort_order: 0, created_at: 'x' }] },
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
      { rowCount: 0, rows: [] },
    ];
    let activeQueries = 0;
    let maxActiveQueries = 0;
    const query = vi.fn(async (sql: string) => {
      if (sql.startsWith('begin') || sql === 'commit' || sql === 'rollback') return { rowCount: 0, rows: [] };
      activeQueries += 1;
      maxActiveQueries = Math.max(maxActiveQueries, activeQueries);
      await new Promise((resolve) => setTimeout(resolve, 1));
      const response = responses.shift();
      activeQueries -= 1;
      return response;
    });
    const release = vi.fn();
    const repository = new PapaStockRepository({ connect: async () => ({ query, release }) } as unknown as pg.Pool);
    const result = await repository.loadSnapshot();

    expect(query).toHaveBeenNthCalledWith(1, 'begin isolation level repeatable read read only');
    expect(query).toHaveBeenCalledWith('commit');
    expect(release).toHaveBeenCalledOnce();
    expect(maxActiveQueries).toBe(1);
    expect(result.stockRecords[0]).toMatchObject({ declaredQuantity: 25000, verifiedQuantity: 24000 });
    expect(result.movements[0]).toMatchObject({ reference: 'MV-1032', quantity: 1000 });
  });

  it('revierte y libera el cliente si falla una consulta del snapshot', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.startsWith('begin') || sql === 'rollback') return { rowCount: 0, rows: [] };
      if (sql.includes('from public.locations')) return { rowCount: 1, rows: [{ id: 'loc' }] };
      throw new Error('snapshot query failed');
    });
    const release = vi.fn();
    const repository = new PapaStockRepository({ connect: async () => ({ query, release }) } as unknown as pg.Pool);

    await expect(repository.loadSnapshot()).rejects.toThrow('snapshot query failed');
    expect(query).toHaveBeenCalledWith('rollback');
    expect(query).not.toHaveBeenCalledWith('commit');
    expect(release).toHaveBeenCalledOnce();
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
      if (sql.includes('insert into public.movement_items')) return { rows: [{ id: 'mitem', movement_id: 'move', lot_id: 'lot', dispatched_quantity: '500', received_quantity: null, received_at: null, unit: 'kg', sort_order: 0, created_at: 'x' }] };
      return { rows: [] };
    });
    const release = vi.fn();
    const repository = new PapaStockRepository({ connect: async () => ({ query, release }) } as unknown as pg.Pool);

    const result = await repository.executeStockTransfer({
      action: 'transfer',
      origin: 'Frigorífico Central',
      destination: 'Galpón Principal',
      items: [{ lotCode: 'A-310', quantity: 500, unit: 'kg' }],
    });

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

    await expect(repository.executeStockTransfer({
      action: 'transfer',
      origin: 'Frigorífico Central',
      destination: 'Galpón Principal',
      items: [{ lotCode: 'A-204', quantity: 500, unit: 'kg' }],
    })).rejects.toMatchObject({ status: 409 });
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
      if (sql.includes('from public.movement_items items')) {
        expect(params?.[0]).toBe('lot-imp-241');
        return { rows: [{
          id: 'mitem', movement_id: 'mov', lot_id: 'lot-imp-241', dispatched_quantity: '35160',
          received_quantity: null, received_at: null, unit: 'kg', sort_order: 0, created_at: 'x',
          origin_location_id: 'loc-imp-campo', destination_location_id: 'loc-imp-dos-panca', status: 'completed',
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

  it('TEST A: un movimiento con dos ítems y commit', async () => {
    const insertedItems: unknown[] = [];
    const query = vi.fn(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [] };
      if (sql.includes('from public.locations')) return { rows: [
        { id: 'oriente', name: 'Campo Oriente', type: 'warehouse', created_at: 'x' },
        { id: 'friga', name: 'Frigorífico A', type: 'cold_storage', created_at: 'x' },
      ] };
      if (sql.includes('from public.lots')) return { rows: [
        { id: 'lot-300', code: '300', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
        { id: 'lot-301', code: '301', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
      ] };
      if (sql.includes('from public.stock_records')) return { rows: [
        { id: 's300', lot_id: 'lot-300', location_id: 'oriente', declared_quantity: '500', verified_quantity: '500', verification_pending: false, updated_at: 'x', unit: 'bags' },
        { id: 's301', lot_id: 'lot-301', location_id: 'oriente', declared_quantity: '300', verified_quantity: '300', verification_pending: false, updated_at: 'x', unit: 'bags' },
      ] };
      if (sql.includes('insert into public.movements')) return { rows: [{
        id: 'move-315', reference: 'MV-N01-TEST', lot_id: null, origin_location_id: 'oriente',
        destination_location_id: 'friga', quantity: '600', movement_date: '2026-08-22', status: 'completed',
        remito_number: '315', created_at: 'x',
      }] };
      if (sql.includes('insert into public.movement_items')) {
        insertedItems.push(sql);
        return { rows: [{
          id: `mitem-${insertedItems.length}`, movement_id: 'move-315', lot_id: insertedItems.length === 1 ? 'lot-300' : 'lot-301',
          dispatched_quantity: insertedItems.length === 1 ? '400' : '200', received_quantity: null, received_at: null,
          unit: 'bags', sort_order: insertedItems.length - 1, created_at: 'x',
        }] };
      }
      return { rows: [] };
    });
    const repository = new PapaStockRepository({ connect: async () => ({ query, release: vi.fn() }) } as unknown as pg.Pool);
    const result = await repository.executeStockTransfer({
      action: 'transfer',
      remitoNumber: '315',
      origin: 'Campo Oriente',
      destination: 'Frigorífico A',
      items: [
        { lotCode: '300', quantity: 400, unit: 'bags' },
        { lotCode: '301', quantity: 200, unit: 'bags' },
      ],
    });
    expect(result.remitoNumber).toBe('315');
    expect(result.items).toHaveLength(2);
    expect(insertedItems).toHaveLength(2);
    expect(query).toHaveBeenCalledWith('commit');
  });

  it('TEST B: rollback si el segundo lote no tiene stock', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [] };
      if (sql.includes('from public.locations')) return { rows: [
        { id: 'oriente', name: 'Campo Oriente', type: 'warehouse', created_at: 'x' },
        { id: 'friga', name: 'Frigorífico A', type: 'cold_storage', created_at: 'x' },
      ] };
      if (sql.includes('from public.lots')) return { rows: [
        { id: 'lot-300', code: '300', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
        { id: 'lot-301', code: '301', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
      ] };
      if (sql.includes('from public.stock_records')) return { rows: [
        { id: 's300', lot_id: 'lot-300', location_id: 'oriente', declared_quantity: '500', verified_quantity: '500', verification_pending: false, updated_at: 'x', unit: 'bags' },
        { id: 's301', lot_id: 'lot-301', location_id: 'oriente', declared_quantity: '100', verified_quantity: '100', verification_pending: false, updated_at: 'x', unit: 'bags' },
      ] };
      return { rows: [] };
    });
    const repository = new PapaStockRepository({ connect: async () => ({ query, release: vi.fn() }) } as unknown as pg.Pool);
    await expect(repository.executeStockTransfer({
      action: 'transfer',
      remitoNumber: '315',
      origin: 'Campo Oriente',
      destination: 'Frigorífico A',
      items: [
        { lotCode: '300', quantity: 400, unit: 'bags' },
        { lotCode: '301', quantity: 200, unit: 'bags' },
      ],
    })).rejects.toMatchObject({ status: 409 });
    expect(query).toHaveBeenCalledWith('rollback');
    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('update public.stock_records'))).toBe(false);
    expect(query.mock.calls.some(([sql]) => String(sql).includes('insert into public.movements'))).toBe(false);
  });

  it('restaura una corrección con UPSERT y revierte si el descuento no afecta una fila', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [], rowCount: 0 };
      if (sql.includes('select * from public.movements')) return { rows: [{
        id: 'original', reference: 'MV-ORIGINAL', lot_id: 'lot-from', origin_location_id: 'other',
        destination_location_id: 'loc', quantity: '10', movement_date: '2026-08-22', status: 'completed',
        kind: 'transfer', reception_status: 'received', data: {}, created_at: 'x',
      }], rowCount: 1 };
      if (sql.includes('select * from public.movement_items')) return { rows: [{
        id: 'original-item', movement_id: 'original', lot_id: 'lot-from', dispatched_quantity: '10',
        received_quantity: '10', received_at: 'x', unit: 'kg', sort_order: 0, data: {}, created_at: 'x',
      }], rowCount: 1 };
      if (sql.includes('select * from public.lots')) return { rows: [
        { id: 'lot-from', code: 'FROM', variety: 'V', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
        { id: 'lot-to', code: 'TO', variety: 'V', campaign: '25/26', producer: 'P', origin: 'O', harvest_date: null, created_at: 'x' },
      ], rowCount: 2 };
      if (sql.includes('select * from public.stock_records')) return { rows: [{
        id: 'stock-to', lot_id: 'lot-to', location_id: 'loc', declared_quantity: '10',
        verified_quantity: '10', verification_pending: false, updated_at: 'x', unit: 'kg',
      }], rowCount: 1 };
      if (sql.startsWith('insert into public.stock_records')) return { rows: [], rowCount: 1 };
      if (sql.startsWith('update public.stock_records')) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 0 };
    });
    const repository = new PapaStockRepository({ connect: async () => ({ query, release: vi.fn() }) } as unknown as pg.Pool);

    await expect(repository.executeLotCorrection({
      originalMovementId: 'original', locationId: 'loc', fromLotCode: 'FROM', toLotCode: 'TO', quantity: 10, unit: 'kg',
    })).rejects.toMatchObject({ status: 409 });

    expect(query.mock.calls.some(([sql]) => String(sql).startsWith('insert into public.stock_records'))).toBe(true);
    expect(query).toHaveBeenCalledWith('rollback');
    expect(query.mock.calls.some(([sql]) => String(sql).includes('insert into public.movements'))).toBe(false);
  });
});
