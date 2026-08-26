import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from './apiClient';
import { askOperationsAssistant, loadOperationsAssistantStatus, normalizeOperationsAnswer } from './operationsAssistantService';

afterEach(() => vi.unstubAllGlobals());

describe('cliente del asistente operativo', () => {
  it('usa únicamente el endpoint PapaStock resuelto por el cliente central', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: {
      answer: 'Respuesta', confidence: 'high', dataQuality: 'operational_only',
      entities: [], warnings: [], evidence: [{ source: 'stock_records', description: 'Snapshot.' }],
    } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await askOperationsAssistant('¿Qué stock hay?');
    expect(fetchMock).toHaveBeenCalledWith(
      apiUrl('/api/ai/operations'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('api.groq.com');
  });

  it('consulta el estado de Groq en Java y no llama a api.groq.com', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: { groqConfigured: false },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadOperationsAssistantStatus()).resolves.toEqual({ groqConfigured: false });
    expect(fetchMock).toHaveBeenCalledWith(
      apiUrl('/api/ai/status'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('api.groq.com');
  });

  it('normaliza el contrato Java sin exigir campos que Java no devuelve', () => {
    const answer = normalizeOperationsAnswer({
      engine: 'llm',
      answer: 'Hay 500 kg.',
      references: [],
    });
    expect(answer).toEqual({
      engine: 'llm',
      answer: 'Hay 500 kg.',
      entities: [],
      warnings: [],
      evidence: [],
    });
  });

  it('conserva referencias Java como evidencia y tolera tipos desconocidos', () => {
    const answer = normalizeOperationsAnswer({
      engine: 'heuristic',
      answer: 'No hay discrepancias.',
      references: [{ type: 'stock_discrepancy', reference: 'abc', description: 'Caso abierto.' }],
    });
    expect(answer.engine).toBe('heuristic');
    expect(answer.evidence).toEqual([{
      source: 'stock_discrepancy', recordId: 'abc', recordLabel: null, description: 'Caso abierto.',
    }]);
  });
});
