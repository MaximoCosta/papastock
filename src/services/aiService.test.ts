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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('aislamiento de IA demo', () => {
  it('en modo database siempre consulta el backend, incluso para el lote hardcodeado', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: {
      engine: 'heuristic', summary: 'respuesta backend', confidence: 0.5,
      explainedQuantity: 0, unexplainedQuantity: 350, hypotheses: [], evidence: [], recommendedAction: 'Revisar.',
    } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await aiService.analyzeDiscrepancy(stock, [], []);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.summary).toBe('respuesta backend');
  });

  it('sólo habilita el análisis y la planilla hardcodeados en modo mock explícito', async () => {
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
