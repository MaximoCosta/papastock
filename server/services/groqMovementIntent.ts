import { z } from 'zod';
import type { Location, Lot, MovementInterpretation, MovementIntent } from '../../src/types/domain';

const parsedIntentSchema = z.object({
  action: z.literal('transfer'),
  lotCode: z.string().trim().min(1).max(40),
  quantityKg: z.number().positive(),
  origin: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'lotCode', 'quantityKg', 'origin', 'destination'],
  properties: {
    action: { type: 'string', enum: ['transfer'] },
    lotCode: { type: 'string' },
    quantityKg: { type: 'number', exclusiveMinimum: 0 },
    origin: { type: 'string' },
    destination: { type: 'string' },
  },
} as const;

interface MovementContext {
  lots: Pick<Lot, 'code'>[];
  locations: Pick<Location, 'name'>[];
}

interface ParserOptions {
  apiKey?: string;
  model: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function parseWithHeuristic(text: string, context: MovementContext): MovementIntent {
  const normalizedText = normalize(text);
  const lot = context.lots.find((item) => normalizedText.includes(normalize(item.code)));
  const quantityMatch = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?|kilogramos?)\b/);
  const locations = context.locations
    .map((item) => ({ item, index: normalizedText.indexOf(normalize(item.name)) }))
    .filter((candidate) => candidate.index >= 0)
    .sort((left, right) => left.index - right.index);

  if (!lot || !quantityMatch || locations.length < 2) {
    throw Object.assign(new Error('No pude identificar lote, cantidad, origen y destino. Escribí las ubicaciones completas.'), { status: 422 });
  }
  const quantityKg = Number(quantityMatch[1].replace(',', '.'));
  return parsedIntentSchema.parse({
    action: 'transfer',
    lotCode: lot.code,
    quantityKg,
    origin: locations[0].item.name,
    destination: locations[1].item.name,
  });
}

export function createMovementIntentParser(options: ParserOptions) {
  return async function parseMovementIntent(text: string, context: MovementContext): Promise<MovementInterpretation> {
    const fallback = () => ({ ...parseWithHeuristic(text, context), engine: 'heuristic' as const });
    if (!options.apiKey) return fallback();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await (options.fetchImpl ?? fetch)('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { authorization: `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: [
                'Interpretá una orden de transferencia de stock agrícola.',
                'Solo extraé datos: nunca autorices, confirmes ni ejecutes la operación.',
                'Usá exactamente un lote y dos ubicaciones del contexto proporcionado.',
                'La primera ubicación mencionada es el origen y la segunda el destino.',
                'Respondé en el JSON Schema solicitado.',
              ].join(' '),
            },
            { role: 'user', content: JSON.stringify({ order: text, available: context }) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'papastock_movement_intent', strict: true, schema: jsonSchema },
          },
        }),
      });
      if (!response.ok) throw new Error(`Groq respondió HTTP ${response.status}`);
      const envelope = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = envelope.choices?.[0]?.message?.content;
      if (!content) throw new Error('Groq no devolvió contenido.');
      return { ...parsedIntentSchema.parse(JSON.parse(content)), engine: 'llm' };
    } catch {
      return fallback();
    } finally {
      clearTimeout(timeout);
    }
  };
}
