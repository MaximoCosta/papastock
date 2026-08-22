import { z } from 'zod';
import type { TraceabilityIntent } from '../../src/types/export';
import { normalizeForMatch, requestStructuredOutput, type GroqOptions } from './groqStructured';

const intentSchema = z.object({
  type: z.literal('treatment'),
  product: z.string().trim().min(1).max(120).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  confidence: z.number().min(0).max(1),
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'product', 'date', 'confidence'],
  properties: {
    type: { type: 'string', enum: ['treatment'] },
    product: { type: ['string', 'null'] },
    date: { type: ['string', 'null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;

const monthNumbers: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
  noviembre: '11', diciembre: '12',
};

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

/** Extrae una fecha del texto. Devuelve null si el texto no tiene ninguna. */
export function extractDate(text: string, today = new Date()): string | null {
  const isoMatch = text.match(/(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)/);
  if (isoMatch) {
    const candidate = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    return isRealCalendarDate(candidate) ? candidate : null;
  }

  const spanishMatch = normalizeForMatch(text)
    .match(/([0-3]?\d)\s+de\s+([a-z]+)(?:\s+(?:de|del)\s+(20\d{2}))?/);
  if (spanishMatch) {
    const month = monthNumbers[spanishMatch[2]];
    if (month) {
      // Sin año explícito se asume la campaña en curso; queda registrado con menor confianza.
      const year = spanishMatch[3] ?? String(today.getUTCFullYear());
      const candidate = `${year}-${month}-${spanishMatch[1].padStart(2, '0')}`;
      return isRealCalendarDate(candidate) ? candidate : null;
    }
  }

  return null;
}

/** Extrae el producto del texto. Devuelve null si no lo encuentra: nunca inventa uno. */
export function extractProduct(text: string): string | null {
  const match = text.match(
    /(?:tratad[oa]s?\s+con|tratamiento\s+(?:con|de)|aplic\w*\s+(?:de\s+)?|producto:?)\s+([\p{L}\d][\p{L}\d .+-]*?)(?:\s+el\s|\s+en\s|\s+durante\s|[,.;]|$)/iu,
  );
  const candidate = match?.[1]?.trim();
  if (!candidate) return null;
  return candidate.length >= 2 && candidate.length <= 120 ? candidate : null;
}

export function parseTraceabilityWithHeuristic(text: string, today = new Date()): TraceabilityIntent {
  const product = extractProduct(text);
  const date = extractDate(text, today);
  const found = Number(Boolean(product)) + Number(Boolean(date));
  return {
    engine: 'heuristic',
    type: 'treatment',
    product,
    date,
    confidence: found === 2 ? 0.6 : found === 1 ? 0.4 : 0.15,
  };
}

export function createTraceabilityIntentParser(options: GroqOptions) {
  return async function parseTraceabilityIntent(text: string): Promise<TraceabilityIntent> {
    const today = new Date();
    const fallback = () => parseTraceabilityWithHeuristic(text, today);
    if (!options.apiKey) return fallback();

    try {
      const raw = await requestStructuredOutput(options, {
        schemaName: 'papastock_traceability_intent',
        jsonSchema,
        system: [
          'Extraés un evento de trazabilidad fitosanitaria desde texto libre de un operador agrícola.',
          'Solo extraés datos: nunca autorizás, confirmás ni ejecutás nada.',
          'Si el texto no menciona el producto, devolvé product = null. Si no menciona la fecha, devolvé date = null.',
          'Nunca inventes un producto ni una fecha que no estén en el texto.',
          'El producto debe aparecer literalmente en el texto del operador.',
          'Las fechas van en formato YYYY-MM-DD. Si el texto da día y mes sin año, usá el año de referencia provisto.',
          'confidence refleja qué tan explícito es el texto, entre 0 y 1.',
          'Respondé exclusivamente con el JSON Schema solicitado.',
        ],
        user: { text, referenceYear: today.getUTCFullYear(), today: today.toISOString().slice(0, 10) },
      });

      const parsed = intentSchema.parse(raw);

      // Antialucinación: el producto tiene que estar en el texto original.
      if (parsed.product && !normalizeForMatch(text).includes(normalizeForMatch(parsed.product))) {
        throw new Error(`Groq devolvió un producto ausente del texto: ${parsed.product}`);
      }
      if (parsed.date && !isRealCalendarDate(parsed.date)) {
        throw new Error(`Groq devolvió una fecha inválida: ${parsed.date}`);
      }
      // Si no encontró ningún dato, la heurística local es igual de útil y más transparente.
      if (!parsed.product && !parsed.date) return fallback();

      return { engine: 'llm', ...parsed };
    } catch (error) {
      console.warn('[ai] trazabilidad → parser local:', error instanceof Error ? error.message : error);
      return fallback();
    }
  };
}
