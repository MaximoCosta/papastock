export interface GroqOptions {
  apiKey?: string;
  model: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export interface StructuredRequest {
  schemaName: string;
  jsonSchema: unknown;
  system: string[];
  user: unknown;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const RATE_LIMIT_HEADERS = [
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-reset-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-tokens',
] as const;

function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  return Math.max(0, (date - now) / 1_000);
}

export class GroqHttpError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;
  readonly rateLimitHeaders: Readonly<Record<string, string>>;

  constructor(response: Response) {
    super(`Groq respondió HTTP ${response.status}`);
    this.name = 'GroqHttpError';
    this.status = response.status;
    this.retryAfterSeconds = parseRetryAfter(response.headers.get('retry-after'));
    this.rateLimitHeaders = Object.fromEntries(RATE_LIMIT_HEADERS.flatMap((header) => {
      const value = response.headers.get(header);
      return value === null ? [] : [[header, value.slice(0, 120)]];
    }));
  }
}

/**
 * Pide un JSON estructurado a Groq y lo devuelve sin interpretar.
 * Lanza ante cualquier problema: la decisión de fallback es del llamador.
 */
export async function requestStructuredOutput(
  options: GroqOptions,
  request: StructuredRequest,
): Promise<unknown> {
  if (!options.apiKey) throw new Error('GROQ_API_KEY ausente.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await (options.fetchImpl ?? fetch)(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        messages: [
          { role: 'system', content: request.system.join(' ') },
          { role: 'user', content: JSON.stringify(request.user) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema },
        },
      }),
    });
    if (!response.ok) throw new GroqHttpError(response);
    const envelope = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = envelope.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq no devolvió contenido.');
    return JSON.parse(content);
  } finally {
    clearTimeout(timeout);
  }
}

/** Comparación tolerante a acentos y mayúsculas para verificar que un dato exista en el texto original. */
export function normalizeForMatch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}
