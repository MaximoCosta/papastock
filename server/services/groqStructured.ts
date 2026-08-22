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
    if (!response.ok) throw new Error(`Groq respondió HTTP ${response.status}`);
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
