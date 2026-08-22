import { z } from 'zod';
import { expandLegacyIntent } from '../../src/lib/movements';
import { normalizeUnit } from '../../src/lib/quantity';
import type { Location, Lot, MovementInterpretation, MovementIntent, MovementIntentItem, QuantityUnit } from '../../src/types/domain';

export const movementItemSchema = z.object({
  lotCode: z.string().trim().min(1).max(40),
  quantity: z.number().positive(),
  unit: z.enum(['bags', 'kg']),
});

export const parsedIntentSchema = z.object({
  action: z.literal('transfer'),
  remitoNumber: z.string().trim().max(40).optional().or(z.literal('')),
  origin: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
  items: z.array(movementItemSchema).min(1).max(50),
}).transform((value) => expandLegacyIntent({
  ...value,
  remitoNumber: value.remitoNumber || undefined,
}));

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'remitoNumber', 'origin', 'destination', 'items'],
  properties: {
    action: { type: 'string', enum: ['transfer'] },
    remitoNumber: { type: 'string' },
    origin: { type: 'string' },
    destination: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['lotCode', 'quantity', 'unit'],
        properties: {
          lotCode: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string', enum: ['bags', 'kg'] },
        },
      },
    },
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

function unitFromToken(token: string): QuantityUnit | undefined {
  return normalizeUnit(token);
}

function locationIndex(text: string, name: string, allNames: string[]): number {
  const normalizedText = normalize(text);
  const normalizedName = normalize(name);
  const exact = normalizedText.indexOf(normalizedName);
  if (exact >= 0) return exact;
  const tail = normalizedName.split(/\s+/).filter((part) => part.length >= 4).at(-1);
  if (!tail) return -1;
  const ambiguous = allNames.some((other) => other !== name && normalize(other).includes(tail));
  if (ambiguous) return -1;
  return normalizedText.indexOf(tail);
}

function matchLocations(text: string, context: MovementContext) {
  const names = context.locations.map((item) => item.name);
  return context.locations
    .map((item) => ({ item, index: locationIndex(text, item.name, names) }))
    .filter((candidate) => candidate.index >= 0)
    .sort((left, right) => left.index - right.index);
}

function collectItems(text: string): MovementIntentItem[] {
  const normalized = normalize(text);
  if (/\b(toneladas?|tn|tns|pallets?)\b/.test(normalized)) {
    throw Object.assign(new Error('Solo se interpretan bolsas o kilos en este flujo. No convierto unidades.'), { status: 422 });
  }

  const byQuantity = [...normalized.matchAll(
    /(\d+(?:[.,]\d+)?)\s*(bolsas?|bags?|kg|kilos?|kilogramos?)\b(?:(?!lote).){0,40}lote\s+([a-z0-9][a-z0-9-]{0,20})/g,
  )];
  const byLot = [...normalized.matchAll(
    /lote\s+([a-z0-9][a-z0-9-]{0,20})\s+(\d+(?:[.,]\d+)?)\s*(bolsas?|bags?|kg|kilos?|kilogramos?)/g,
  )];

  const fromQuantity: MovementIntentItem[] = byQuantity.flatMap((match) => {
    const unit = unitFromToken(match[2]);
    if (!unit) return [];
    return [{ lotCode: match[3].toUpperCase() === match[3] ? match[3] : match[3], quantity: Number(match[1].replace(',', '.')), unit }];
  });
  const fromLot: MovementIntentItem[] = byLot.flatMap((match) => {
    const unit = unitFromToken(match[3]);
    if (!unit) return [];
    return [{ lotCode: match[1], quantity: Number(match[2].replace(',', '.')), unit }];
  });

  if (fromLot.length > 0 && fromQuantity.length > 0) {
    const left = fromQuantity.map((item) => `${item.lotCode}:${item.quantity}:${item.unit}`).sort().join('|');
    const right = fromLot.map((item) => `${item.lotCode}:${item.quantity}:${item.unit}`).sort().join('|');
    if (left === right) return fromLot;
    return fromLot.length >= fromQuantity.length ? fromLot : fromQuantity;
  }
  return fromLot.length ? fromLot : fromQuantity;
}

function resolveLotCode(extracted: string, context: MovementContext): string {
  const exact = context.lots.find((lot) => normalize(lot.code) === normalize(extracted));
  if (exact) return exact.code;
  const contained = context.lots.filter((lot) => normalize(extracted).includes(normalize(lot.code)) || normalize(lot.code).includes(normalize(extracted)));
  if (contained.length === 1) return contained[0].code;
  if (contained.length > 1) {
    throw Object.assign(new Error('Hay más de un lote que coincide con el texto. Especificá el código exacto.'), { status: 422 });
  }
  return extracted;
}

export function parseWithHeuristic(text: string, context: MovementContext): MovementIntent {
  const remitoMatch = normalize(text).match(/remito\s*(?:n(?:u|ú)mero\s*)?(?:n[°o.]?\s*)?(\d+)/i)
    ?? text.match(/remito\s+(\d+)/i);
  const locations = matchLocations(text, context);
  const items = collectItems(text).map((item) => ({
    ...item,
    lotCode: resolveLotCode(item.lotCode, context),
  }));

  if (!items.length || locations.length < 2) {
    throw Object.assign(new Error('No pude identificar lotes, cantidades, origen y destino. Escribí las ubicaciones completas.'), { status: 422 });
  }

  return parsedIntentSchema.parse({
    action: 'transfer',
    remitoNumber: remitoMatch?.[1],
    origin: locations[0].item.name,
    destination: locations[1].item.name,
    items,
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
                'Puede haber una o varias líneas de lote. Extraé TODAS las líneas; no sumes, no elijas solo la primera.',
                'No inventes lote, cantidad, unidad, origen, destino ni número de remito.',
                'No conviertas bolsas a kilos ni kilos a bolsas.',
                'Si una cantidad o unidad no está dicha, no la completes.',
                'La primera ubicación mencionada es el origen y la segunda el destino.',
                'remitoNumber es el número de papel (vacío si no se mencionó).',
                'unit es bags para bolsas y kg para kilos.',
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
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 422) {
        throw error;
      }
      return fallback();
    } finally {
      clearTimeout(timeout);
    }
  };
}
