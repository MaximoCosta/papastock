import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StockView } from '../types/domain';
import { aiService } from './aiService';

const stock: StockView = {
  id: 'stock-ludmilla', lotId: 'lot-ludmilla', locationId: 'loc-santa-ana',
  declaredQuantity: 161600, verifiedQuantity: 161250, updatedAt: '2026-08-23T12:00:00Z',
  verificationPending: false, difference: -350, status: 'discrepancy',
  lot: { id: 'lot-ludmilla', code: 'LUDMILLA-600', variety: 'Ludmilla', campaign: '2026', producer: 'Papasud', origin: 'Balcarce' },
  location: { id: 'loc-santa-ana', name: 'Santa Ana', type: 'cold_storage' },
};

const a204: StockView = {
  id: 'stock-a204', lotId: 'lot-a204', locationId: 'loc-south',
  declaredQuantity: 25000, verifiedQuantity: 24000, updatedAt: '2026-08-21T10:30:00-03:00',
  verificationPending: false, difference: -1000, status: 'discrepancy',
  lot: { id: 'lot-a204', code: 'A-204', variety: 'Innovator', campaign: '2025/26', producer: 'El Ombú', origin: 'Balcarce' },
  location: { id: 'loc-south', name: 'Frigorífico Sur', type: 'cold_storage' },
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('aislamiento de IA demo', () => {
  it('analiza la discrepancia en el cliente para el oral, sin depender de Groq', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await aiService.analyzeDiscrepancy(a204, [{
      id: 'movement-1032', reference: 'MV-1032', lotId: 'lot-a204', quantity: 1000,
      originLocationId: 'loc-north', destinationLocationId: 'loc-south',
      date: '2026-08-20', status: 'pending',
    }], []);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.engine).toBe('llm');
    expect(result.relatedMovementReference).toBe('MV-1032');
    expect(result.explainedQuantity).toBe(1000);
    expect(result.summary).toMatch(/A-204/);
    expect(result.summary).toMatch(/MV-1032/);
    expect(result.hypotheses.length).toBeGreaterThan(0);
  });

  it('explica LUDMILLA-600 con el faltante y el movimiento pendiente', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    const result = await aiService.analyzeDiscrepancy(stock, [{
      id: 'mv-1847', reference: 'MV-1847', lotId: stock.lotId, quantity: 350,
      originLocationId: stock.locationId, destinationLocationId: stock.locationId,
      date: '2026-08-20', status: 'pending',
    }], []);
    expect(result.engine).toBe('llm');
    expect(result.relatedMovementReference).toBe('MV-1847');
    expect(result.explainedQuantity).toBe(350);
    expect(result.summary).toMatch(/Ludmilla|LUDMILLA-600/);
  });

  it('sólo habilita la planilla hardcodeada en modo mock explícito', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'mock');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await aiService.analyzeDiscrepancy(stock, [], []);
    expect(result.relatedMovementReference).toBe('MV-1847');
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(aiService.parseStockControlSheet({} as File, [stock])).resolves.toHaveLength(1);
  });

  it('rechaza la planilla hardcodeada fuera del modo mock', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    await expect(aiService.parseStockControlSheet({} as File, [stock])).rejects.toThrow(/modo mock explícito/);
  });
});
