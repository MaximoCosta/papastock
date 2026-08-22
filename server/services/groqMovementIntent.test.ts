import { describe, expect, it } from 'vitest';
import { createMovementIntentParser, parseWithHeuristic } from './groqMovementIntent';

const context = {
  lots: [{ code: 'A-310' }, { code: '300' }, { code: '301' }],
  locations: [
    { name: 'Frigorífico Central' },
    { name: 'Galpón Principal' },
    { name: 'Campo Oriente' },
    { name: 'Frigorífico A' },
  ],
};
const text = 'Mové 500 kg del lote A-310 del Frigorífico Central al Galpón Principal.';
const content = JSON.stringify({
  action: 'transfer',
  remitoNumber: '',
  origin: 'Frigorífico Central',
  destination: 'Galpón Principal',
  items: [{ lotCode: 'A-310', quantity: 500, unit: 'kg' }],
});
const envelope = (value: string) => new Response(JSON.stringify({ choices: [{ message: { content: value } }] }), { status: 200 });

describe('intérprete N01', () => {
  it('devuelve una intención estructurada de Groq sin ejecutarla', async () => {
    const parse = createMovementIntentParser({ apiKey: 'test', model: 'model', timeoutMs: 50, fetchImpl: async () => envelope(content) });
    expect(await parse(text, context)).toMatchObject({
      engine: 'llm',
      origin: 'Frigorífico Central',
      destination: 'Galpón Principal',
      items: [{ lotCode: 'A-310', quantity: 500, unit: 'kg' }],
    });
  });

  it('usa parser local cuando Groq falla', async () => {
    const parse = createMovementIntentParser({ apiKey: 'test', model: 'model', timeoutMs: 50, fetchImpl: async () => new Response('', { status: 429 }) });
    expect(await parse(text, context)).toMatchObject({
      engine: 'heuristic',
      items: [{ lotCode: 'A-310', quantity: 500, unit: 'kg' }],
    });
  });

  it('rechaza texto incompleto sin inventar ubicaciones', async () => {
    const parse = createMovementIntentParser({ model: 'model', timeoutMs: 50 });
    await expect(parse('Mové 500 kg del lote A-310.', context)).rejects.toThrow('No pude identificar');
  });

  it('TEST C: extrae remito y dos líneas de bolsas', () => {
    const parsed = parseWithHeuristic(
      'Remito 315, de Oriente al Frigorífico A: 400 bolsas lote 300 y 200 bolsas lote 301',
      context,
    );
    expect(parsed.remitoNumber).toBe('315');
    expect(parsed.origin).toBe('Campo Oriente');
    expect(parsed.destination).toBe('Frigorífico A');
    expect(parsed.items).toEqual([
      { lotCode: '300', quantity: 400, unit: 'bags' },
      { lotCode: '301', quantity: 200, unit: 'bags' },
    ]);
  });

  it('entiende líneas en kg sin elegir un solo lote', () => {
    const parsed = parseWithHeuristic(
      'lote 300 400 kg, lote 301 250 kg del Campo Oriente al Frigorífico A',
      context,
    );
    expect(parsed.items).toEqual([
      { lotCode: '300', quantity: 400, unit: 'kg' },
      { lotCode: '301', quantity: 250, unit: 'kg' },
    ]);
  });

  it('falla si el texto es ambiguo en lugar de elegir el primer lote', () => {
    expect(() => parseWithHeuristic('Mové mercadería de Campo Oriente a Frigorífico A', context)).toThrow();
  });
});
