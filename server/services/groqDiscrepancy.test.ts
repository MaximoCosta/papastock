import { describe, expect, it } from 'vitest';
import type { DiscrepancyInput } from './discrepancyHeuristic';
import { createDiscrepancyAnalyzer } from './groqDiscrepancy';

const input: DiscrepancyInput = {
  lot: { id: 'lot-a204', code: 'A-204' },
  stock: { id: 's', lotId: 'lot-a204', locationId: 'south', declaredQuantity: 25000, verifiedQuantity: 24000, updatedAt: '2026-08-21' },
  movements: [{ id: 'm', lotId: 'lot-a204', originLocationId: 'north', destinationLocationId: 'south', quantity: 1000, date: '2026-08-20', status: 'pending', reference: 'MV-1032' }],
  traceability: [],
};

const validContent = JSON.stringify({
  summary: 'MV-1032 coincide.', confidence: 0.97, explainedQuantity: 1000, unexplainedQuantity: 0,
  hypotheses: [{ title: 'Pendiente', explanation: 'Coincidencia exacta.', movementReferences: ['MV-1032'] }],
  evidence: [{ type: 'movement', reference: 'MV-1032', description: '1000 kg pendientes.' }],
  recommendedAction: 'Revisión humana del remito.',
});

const envelope = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { 'content-type': 'application/json' } });
const analyzer = (fetchImpl: typeof fetch, timeoutMs = 50) => createDiscrepancyAnalyzer({ apiKey: 'test-key', model: 'openai/gpt-oss-20b', timeoutMs, fetchImpl });

describe('adaptador Groq', () => {
  it('acepta una respuesta estructurada válida', async () => {
    const result = await analyzer(async () => envelope(validContent))(input);
    expect(result).toMatchObject({ engine: 'llm', relatedMovementReference: 'MV-1032', confidence: 0.97 });
  });

  it('usa heurística ante JSON inválido', async () => {
    expect(await analyzer(async () => envelope('{oops'))(input)).toMatchObject({ engine: 'heuristic', relatedMovementReference: 'MV-1032' });
  });

  it('usa heurística ante referencia inventada', async () => {
    const invented = validContent.replaceAll('MV-1032', 'MV-9999');
    expect(await analyzer(async () => envelope(invented))(input)).toMatchObject({ engine: 'heuristic', relatedMovementReference: 'MV-1032' });
  });

  it('usa heurística ante HTTP 429', async () => {
    expect(await analyzer(async () => new Response('', { status: 429 }))(input)).toMatchObject({ engine: 'heuristic' });
  });

  it('usa heurística ante timeout', async () => {
    const hangingFetch = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })) as typeof fetch;
    expect(await analyzer(hangingFetch, 2)(input)).toMatchObject({ engine: 'heuristic' });
  });

  it('no llama la red si falta la clave', async () => {
    let called = false;
    const analyze = createDiscrepancyAnalyzer({ model: 'x', timeoutMs: 5, fetchImpl: async () => { called = true; return envelope(validContent); } });
    expect(await analyze(input)).toMatchObject({ engine: 'heuristic' });
    expect(called).toBe(false);
  });
});
