import { describe, expect, it } from 'vitest';
import { getOperationalMetrics, getStockStatus, getStockViews } from '../services/stockService';
import type { LotRow, StockRecordRow, TraceabilityEventRow } from '../types/database';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { stockRecords } from '../data/stock';
import { mapLot, mapStockRecord, mapTraceabilityEvent } from '../../server/repositories/mappers';

describe('PostgreSQL row mappers', () => {
  it('maps snake_case rows without leaking database naming into the UI', () => {
    const lotRow: LotRow = {
      id: 'lot-a310', code: 'A-310', variety: 'Innovator', campaign: '2025/26',
      producer: 'La Esperanza Agro', origin: 'Balcarce', harvest_date: '2026-07-28',
      created_at: '2026-08-21T12:00:00Z',
    };
    const stockRow: StockRecordRow = {
      id: 'stock-a310', lot_id: 'lot-a310', location_id: 'loc-central',
      declared_quantity: 22000, verified_quantity: 22000, verification_pending: false,
      updated_at: '2026-08-21T12:15:00Z',
    };

    expect(mapLot(lotRow)).toMatchObject({ id: 'lot-a310', code: 'A-310', harvestDate: '2026-07-28' });
    expect(mapStockRecord(stockRow)).toMatchObject({ lotId: 'lot-a310', declaredQuantity: 22000 });
  });

  it('maps JSON traceability data as a domain record', () => {
    const row: TraceabilityEventRow = {
      id: 'trace-a310-treatment', lot_id: 'lot-a310', event_type: 'treatment',
      event_date: '2026-08-18', location_id: null, data: { product: 'Mancozeb' },
      created_at: '2026-08-21T12:00:00Z',
    };

    expect(mapTraceabilityEvent(row)).toEqual({
      id: 'trace-a310-treatment', lotId: 'lot-a310', type: 'treatment',
      date: '2026-08-18', data: { product: 'Mancozeb' },
    });
  });
});

describe('stock projections over repository data', () => {
  it('preserves the A-204 discrepancy and aggregate metrics', () => {
    const views = getStockViews(stockRecords, lots, locations);
    const a204 = views.find((record) => record.lot.code === 'A-204');

    expect(a204).toMatchObject({ declaredQuantity: 25000, verifiedQuantity: 24000, difference: -1000, status: 'discrepancy' });
    expect(getOperationalMetrics(views)).toMatchObject({ activeLots: 10, discrepancies: 2, pendingExports: 1 });
  });

  it('keeps status logic deterministic', () => {
    expect(getStockStatus(22000, 22000)).toBe('verified');
    expect(getStockStatus(17000, 0, true)).toBe('pending');
  });
});
