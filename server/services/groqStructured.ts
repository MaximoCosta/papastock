export interface GroqOptions {
  apiKey?: string;
  model: string;
  timeoutMs: number;
  maxRequestBodyBytes?: number;
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
const SAFE_ERROR_HEADERS = [
  'content-length',
  'content-type',
  'retry-after',
  'x-request-id',
  'cf-ray',
  ...RATE_LIMIT_HEADERS,
] as const;
const MAX_ERROR_BODY_BYTES = 8_192;

export interface StructuredRequestMetrics {
  systemPromptBytes: number;
  schemaBytes: number;
  messagesBytes: number;
  requestBodyBytes: number;
  estimatedInputTokens: number;
}

export class GroqRequestBodyLimitError extends Error {
  readonly status = 413;
  readonly requestBodyBytes: number;
  readonly maxRequestBodyBytes: number;

  constructor(requestBodyBytes: number, maxRequestBodyBytes: number) {
    super('El request de IA supera el presupuesto seguro configurado.');
    this.name = 'GroqRequestBodyLimitError';
    this.requestBodyBytes = requestBodyBytes;
    this.maxRequestBodyBytes = maxRequestBodyBytes;
  }
}

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
  readonly safeHeaders: Readonly<Record<string, string>>;
  readonly responseError?: Readonly<{ code?: string; type?: string }>;
  readonly requestBodyBytes: number;

  constructor(
    response: Response,
    requestBodyBytes: number,
    responseError?: { code?: string; type?: string },
  ) {
    super(`Groq respondió HTTP ${response.status}`);
    this.name = 'GroqHttpError';
    this.status = response.status;
    this.requestBodyBytes = requestBodyBytes;
    this.retryAfterSeconds = parseRetryAfter(response.headers.get('retry-after'));
    this.safeHeaders = Object.fromEntries(SAFE_ERROR_HEADERS.flatMap((header) => {
      const value = response.headers.get(header);
      return value === null ? [] : [[header, value.slice(0, 120)]];
    }));
    this.rateLimitHeaders = Object.fromEntries(RATE_LIMIT_HEADERS.flatMap((header) => {
      const value = this.safeHeaders[header];
      return value === undefined ? [] : [[header, value]];
    }));
    this.responseError = responseError;
  }
}

function safeErrorIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim();
  return candidate && /^[a-zA-Z0-9_.:/-]+$/.test(candidate) ? candidate.slice(0, 120) : undefined;
}

async function parseSafeError(response: Response): Promise<{ code?: string; type?: string } | undefined> {
  const text = (await response.text()).slice(0, MAX_ERROR_BODY_BYTES);
  if (!text) return undefined;
  try {
    const payload = JSON.parse(text) as { error?: unknown };
    const source = payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error)
      ? payload.error as Record<string, unknown>
      : {};
    const result = {
      code: safeErrorIdentifier(source.code),
      type: safeErrorIdentifier(source.type),
    };
    return Object.values(result).some(Boolean) ? result : undefined;
  } catch {
    return undefined;
  }
}

function structuredPayload(model: string, request: StructuredRequest) {
  return {
    model,
    temperature: 0,
    messages: [
      { role: 'system', content: request.system.join(' ') },
      { role: 'user', content: JSON.stringify(request.user) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema },
    },
  };
}

export function serializeStructuredRequest(model: string, request: StructuredRequest) {
  const payload = structuredPayload(model, request);
  const body = JSON.stringify(payload);
  const messages = payload.messages;
  const requestBodyBytes = Buffer.byteLength(body, 'utf8');
  const metrics: StructuredRequestMetrics = {
    systemPromptBytes: Buffer.byteLength(messages[0].content, 'utf8'),
    schemaBytes: Buffer.byteLength(JSON.stringify(request.jsonSchema), 'utf8'),
    messagesBytes: Buffer.byteLength(JSON.stringify(messages), 'utf8'),
    requestBodyBytes,
    estimatedInputTokens: Math.ceil(requestBodyBytes / 4),
  };
  return { body, metrics };
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
    const serialized = serializeStructuredRequest(options.model, request);
    if (options.maxRequestBodyBytes !== undefined
      && serialized.metrics.requestBodyBytes > options.maxRequestBodyBytes) {
      throw new GroqRequestBodyLimitError(serialized.metrics.requestBodyBytes, options.maxRequestBodyBytes);
    }
    const response = await (options.fetchImpl ?? fetch)(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
      body: serialized.body,
    });
    if (!response.ok) {
      throw new GroqHttpError(
        response,
        serialized.metrics.requestBodyBytes,
        await parseSafeError(response),
      );
    }
    const envelope = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = envelope.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq no devolvió contenido.');
    return parseStructuredContent(content);
  } catch (error) {
    if (
      !(error instanceof GroqHttpError)
      && !(error instanceof GroqRequestBodyLimitError)
      && (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError'))
    ) {
      throw new Error(`Groq superó el timeout de ${options.timeoutMs} ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Parsea el JSON del modelo; acepta fences markdown si el schema estricto no se respetó. */
export function parseStructuredContent(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        throw new Error('Groq no devolvió JSON válido.');
      }
    }
    throw new Error('Groq no devolvió JSON válido.');
  }
}

/** Comparación tolerante a acentos y mayúsculas para verificar que un dato exista en el texto original. */
export function normalizeForMatch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}
