import { describe, expect, it } from 'vitest';
import { createExportRequirementsParser, type ExportRequirementsInput } from './groqExportRequirements';

const input: ExportRequirementsInput = {
  country: 'Brasil',
  documentType: 'proforma',
  sourceText: 'La documentación debe contener número de lote, variedad, origen, peso neto y tratamiento fitosanitario.',
};

const envelope = (content: string) => new Response(
  JSON.stringify({ choices: [{ message: { content } }] }),
  { status: 200, headers: { 'content-type': 'application/json' } },
);

const parser = (fetchImpl: typeof fetch, timeoutMs = 50) => createExportRequirementsParser({
  apiKey: 'test-key', model: 'openai/gpt-oss-20b', timeoutMs, fetchImpl,
});

const hangingFetch = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
  init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
})) as typeof fetch;

const validContent = JSON.stringify({
  requirements: [
    { key: 'lotCode', label: 'Nro de lote', required: true },
    { key: 'treatment', label: 'Fitosanitario', required: true },
  ],
});

describe('intérprete de requisitos documentales N03', () => {
  it('acepta una lista estructurada válida', async () => {
    const result = await parser(async () => envelope(validContent))(input);
    expect(result.engine).toBe('llm');
    expect(result.requirements.map((item) => item.key)).toEqual(['lotCode', 'treatment']);
  });

  it('impone la etiqueta canónica y no la que devuelve el modelo', async () => {
    const result = await parser(async () => envelope(validContent))(input);
    expect(result.requirements[0].label).toBe('Número de lote');
    expect(result.requirements[1].label).toBe('Tratamiento fitosanitario');
  });

  it('acepta varias claves del catálogo', async () => {
    const content = JSON.stringify({
      requirements: ['lotCode', 'variety', 'origin', 'quantity', 'treatment']
        .map((key) => ({ key, label: key, required: true })),
    });
    const result = await parser(async () => envelope(content))(input);
    expect(result.engine).toBe('llm');
    expect(result.requirements).toHaveLength(5);
  });

  it('rechaza una clave fuera del catálogo y cae al parser local', async () => {
    const content = JSON.stringify({ requirements: [{ key: 'randomField', label: 'Otro', required: true }] });
    const result = await parser(async () => envelope(content))(input);
    expect(result.engine).toBe('heuristic');
    expect(result.requirements.map((item) => item.key)).toContain('treatment');
  });

  it('rechaza claves duplicadas', async () => {
    const content = JSON.stringify({
      requirements: [
        { key: 'lotCode', label: 'A', required: true },
        { key: 'lotCode', label: 'B', required: true },
      ],
    });
    expect((await parser(async () => envelope(content))(input)).engine).toBe('heuristic');
  });

  it('usa el parser local ante JSON inválido', async () => {
    expect((await parser(async () => envelope('no-json'))(input)).engine).toBe('heuristic');
  });

  it('usa el parser local ante HTTP 500', async () => {
    expect((await parser(async () => new Response('', { status: 500 }))(input)).engine).toBe('heuristic');
  });

  it('usa el parser local ante timeout', async () => {
    expect((await parser(hangingFetch, 2)(input)).engine).toBe('heuristic');
  });

  it('cae al parser local si el modelo devuelve una lista vacía', async () => {
    const result = await parser(async () => envelope(JSON.stringify({ requirements: [] })))(input);
    expect(result.engine).toBe('heuristic');
    expect(result.requirements.length).toBeGreaterThan(0);
  });

  it('no llama la red si falta la clave y deriva del texto', async () => {
    let called = false;
    const parse = createExportRequirementsParser({
      model: 'x',
      timeoutMs: 5,
      fetchImpl: async () => { called = true; return envelope(validContent); },
    });
    const result = await parse(input);
    expect(called).toBe(false);
    expect(result.engine).toBe('heuristic');
    expect(result.requirements.map((item) => item.key)).toEqual(
      expect.arrayContaining(['lotCode', 'variety', 'origin', 'quantity', 'treatment']),
    );
  });

  it('devuelve una lista vacía si el texto no menciona ningún campo conocido', async () => {
    const parse = createExportRequirementsParser({ model: 'x', timeoutMs: 5 });
    const result = await parse({ ...input, sourceText: 'Texto sin ninguna referencia documental util.' });
    expect(result).toEqual({ engine: 'heuristic', requirements: [] });
  });
});
