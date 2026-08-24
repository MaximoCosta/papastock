import { afterEach, describe, expect, it, vi } from 'vitest';
import { askOperationsAssistant } from './operationsAssistantService';

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
});
