import { describe, expect, it } from 'vitest';
import { createMovementIntentParser } from './groqMovementIntent';

const context = {
  lots: [{ code: 'A-310' }],
  locations: [{ name: 'Frigorífico Central' }, { name: 'Galpón Principal' }],
};
const text = 'Mové 500 kg del lote A-310 del Frigorífico Central al Galpón Principal.';
const content = JSON.stringify({ action: 'transfer', lotCode: 'A-310', quantityKg: 500, origin: 'Frigorífico Central', destination: 'Galpón Principal' });
const envelope = (value: string) => new Response(JSON.stringify({ choices: [{ message: { content: value } }] }), { status: 200 });

describe('intérprete N01', () => {
  it('devuelve una intención estructurada de Groq sin ejecutarla', async () => {
    const parse = createMovementIntentParser({ apiKey: 'test', model: 'model', timeoutMs: 50, fetchImpl: async () => envelope(content) });
    expect(await parse(text, context)).toEqual({ ...JSON.parse(content), engine: 'llm' });
  });

  it('usa parser local cuando Groq falla', async () => {
    const parse = createMovementIntentParser({ apiKey: 'test', model: 'model', timeoutMs: 50, fetchImpl: async () => new Response('', { status: 429 }) });
    expect(await parse(text, context)).toMatchObject({ engine: 'heuristic', lotCode: 'A-310', quantityKg: 500 });
  });

  it('rechaza texto incompleto sin inventar ubicaciones', async () => {
    const parse = createMovementIntentParser({ model: 'model', timeoutMs: 50 });
    await expect(parse('Mové 500 kg del lote A-310.', context)).rejects.toThrow('No pude identificar');
  });
});
