import { afterEach, describe, expect, it, vi } from 'vitest';
import { askOperationsAssistant, loadOperationsAssistantStatus } from './operationsAssistantService';

afterEach(() => vi.unstubAllGlobals());

describe('cliente del asistente operativo', () => {
  it('usa únicamente el endpoint same-origin Express', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: {
      answer: 'Respuesta', confidence: 'high', dataQuality: 'operational_only',
      entities: [], warnings: [], evidence: [{ source: 'stock_records', description: 'Snapshot.' }],
    } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await askOperationsAssistant('¿Qué stock hay?');
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/operations', expect.objectContaining({ method: 'POST' }));
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('api.groq.com');
  });

  it('consulta el estado de Groq en Express y no llama a api.groq.com', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: { groqConfigured: false, frontendKeyIgnored: true },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadOperationsAssistantStatus()).resolves.toEqual({
      groqConfigured: false,
      frontendKeyIgnored: true,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/status', expect.objectContaining({ credentials: 'include' }));
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('api.groq.com');
  });
});
