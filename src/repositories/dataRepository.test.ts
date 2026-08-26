import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from '../services/apiClient';
import { loadPapaStockSnapshot } from './dataRepository';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const remoteSnapshot = {
  locations: [{ id: 'loc', name: 'Sur', type: 'cold_storage' }],
  lots: [
    { id: 'lot-h118', code: 'H-118', variety: 'Spunta', campaign: '2026', producer: 'P', origin: 'Balcarce' },
    { id: 'lot-b221', code: 'B-221', variety: 'Russet', campaign: '2026', producer: 'P', origin: 'Balcarce' },
  ],
  stockRecords: [
    {
      id: 'stock-h118', lotId: 'lot-h118', locationId: 'loc', declaredQuantity: 111, verifiedQuantity: 109,
      verificationPending: false, updatedAt: '2026-08-23T12:00:00Z',
    },
    {
      id: 'stock-b221', lotId: 'lot-b221', locationId: 'loc', declaredQuantity: 16000, verifiedQuantity: 16000,
      verificationPending: false, updatedAt: '2026-08-23T12:00:00Z',
    },
  ],
  movements: [],
  traceabilityEvents: [],
};

describe('loadPapaStockSnapshot', () => {
  it('preserva el stock PostgreSQL de lotes fuera de la demo oral y no inyecta catálogos mock', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: remoteSnapshot }), {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadPapaStockSnapshot();
    expect(result.source).toBe('database');
    expect(result.data.stockRecords.find((record) => record.lotId === 'lot-h118')).toMatchObject({
      declaredQuantity: 111, verifiedQuantity: 109,
    });
    expect(result.data.shelves).toEqual([]);
    expect(result.data.shelfUnits).toEqual([]);
    expect(result.data.transporters).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/snapshot'), expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('proyecta las discrepancias de demo oral sobre B-221 sin escribir PostgreSQL', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: remoteSnapshot }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));

    const result = await loadPapaStockSnapshot();
    expect(result.data.stockRecords.find((record) => record.lotId === 'lot-b221')).toMatchObject({
      declaredQuantity: 16000, verifiedQuantity: 15200, verificationPending: false,
    });
    expect(result.data.movements.some((movement) => movement.reference === 'MV-1051')).toBe(true);
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
