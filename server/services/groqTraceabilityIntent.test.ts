import { describe, expect, it } from 'vitest';
import { createTraceabilityIntentParser } from './groqTraceabilityIntent';

const text = 'El lote fue tratado con Mancozeb el 18 de agosto de 2026.';
const textWithoutDate = 'Tratamiento con Mancozeb.';

const envelope = (content: string) => new Response(
  JSON.stringify({ choices: [{ message: { content } }] }),
  { status: 200, headers: { 'content-type': 'application/json' } },
);

const parser = (fetchImpl: typeof fetch, timeoutMs = 50) => createTraceabilityIntentParser({
  apiKey: 'test-key', model: 'openai/gpt-oss-20b', timeoutMs, fetchImpl,
});

const hangingFetch = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
  init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
})) as typeof fetch;

describe('intérprete de trazabilidad N03', () => {
  it('devuelve producto y fecha estructurados desde Groq', async () => {
    const content = JSON.stringify({ type: 'treatment', product: 'Mancozeb', date: '2026-08-18', confidence: 0.96 });
    expect(await parser(async () => envelope(content))(text)).toEqual({
      engine: 'llm', type: 'treatment', product: 'Mancozeb', date: '2026-08-18', confidence: 0.96,
    });
  });

  it('acepta fecha nula sin inventarla', async () => {
    const content = JSON.stringify({ type: 'treatment', product: 'Mancozeb', date: null, confidence: 0.88 });
    expect(await parser(async () => envelope(content))(textWithoutDate)).toMatchObject({
      engine: 'llm', product: 'Mancozeb', date: null,
    });
  });

  it('descarta un producto que no está en el texto original', async () => {
    const content = JSON.stringify({ type: 'treatment', product: 'Clorotalonil', date: '2026-08-18', confidence: 0.9 });
    expect(await parser(async () => envelope(content))(text)).toMatchObject({
      engine: 'heuristic', product: 'Mancozeb', date: '2026-08-18',
    });
  });

  it('usa el parser local ante JSON inválido', async () => {
    expect(await parser(async () => envelope('{oops'))(text)).toMatchObject({
      engine: 'heuristic', product: 'Mancozeb', date: '2026-08-18',
    });
  });

  it('usa el parser local ante un schema inválido', async () => {
    const content = JSON.stringify({ type: 'harvest', product: 'Mancozeb', date: '18/08/2026', confidence: 3 });
    expect(await parser(async () => envelope(content))(text)).toMatchObject({ engine: 'heuristic' });
  });

  it('usa el parser local ante HTTP 429', async () => {
    expect(await parser(async () => new Response('', { status: 429 }))(text)).toMatchObject({
      engine: 'heuristic', product: 'Mancozeb',
    });
  });

  it('usa el parser local ante timeout', async () => {
    expect(await parser(hangingFetch, 2)(text)).toMatchObject({ engine: 'heuristic', product: 'Mancozeb' });
  });

  it('no llama la red si falta la clave', async () => {
    let called = false;
    const parse = createTraceabilityIntentParser({
      model: 'x',
      timeoutMs: 5,
      fetchImpl: async () => { called = true; return envelope('{}'); },
    });
    expect(await parse(text)).toMatchObject({ engine: 'heuristic', product: 'Mancozeb', date: '2026-08-18' });
    expect(called).toBe(false);
  });

  it('el parser local devuelve null en lugar de inventar datos', async () => {
    const parse = createTraceabilityIntentParser({ model: 'x', timeoutMs: 5 });
    expect(await parse('No recuerdo qué se hizo con este lote.')).toMatchObject({
      engine: 'heuristic', product: null, date: null,
    });
  });
});
