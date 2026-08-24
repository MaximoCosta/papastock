import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPapaStockSnapshot } from './dataRepository';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const remoteSnapshot = {
  locations: [{ id: 'loc', name: 'Sur', type: 'cold_storage' }],
  lots: [{ id: 'lot', code: 'A-204', variety: 'Innovator', campaign: '2026', producer: 'P', origin: 'Balcarce' }],
  stockRecords: [{
    id: 'stock', lotId: 'lot', locationId: 'loc', declaredQuantity: 111, verifiedQuantity: 109,
    verificationPending: false, updatedAt: '2026-08-23T12:00:00Z',
  }],
  movements: [],
  traceabilityEvents: [],
};

describe('loadPapaStockSnapshot', () => {
  it('preserva exactamente el stock PostgreSQL y no inyecta catálogos mock', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: remoteSnapshot }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));

    const result = await loadPapaStockSnapshot();
    expect(result.source).toBe('database');
    expect(result.data.stockRecords[0]).toMatchObject({ declaredQuantity: 111, verifiedQuantity: 109 });
    expect(result.data.shelves).toEqual([]);
    expect(result.data.shelfUnits).toEqual([]);
    expect(result.data.transporters).toEqual([]);
  });

  it('no sustituye una API caída por el dataset demo', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const result = await loadPapaStockSnapshot();
    expect(result.source).toBe('unavailable');
    expect(result.data.lots).toEqual([]);
    expect(result.warning).toContain('No se sustituyeron datos reales');
  });

  it('sólo activa el dataset demo mediante VITE_DATA_SOURCE=mock', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'mock');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadPapaStockSnapshot();
    expect(result.source).toBe('mock');
    expect(result.data.lots.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
