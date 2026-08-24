import { describe, expect, it, vi } from 'vitest';
import { GroqHttpError, requestStructuredOutput } from './groqStructured';

const request = {
  schemaName: 'fixture',
  jsonSchema: { type: 'object' },
  system: ['system-fixture'],
  user: { question: 'question-fixture', context: { stock: 1 } },
};

describe('cliente Groq Structured Output', () => {
  it('preserva status, Retry-After y sólo headers rate-limit permitidos', async () => {
    const fetchImpl = vi.fn(async () => new Response('', {
      status: 429,
      headers: {
        'retry-after': '3',
        'x-ratelimit-limit-requests': '30',
        'x-ratelimit-remaining-requests': '0',
        'x-ratelimit-reset-requests': '2s',
        'x-ratelimit-limit-tokens': '6000',
        'x-ratelimit-remaining-tokens': '0',
        'x-ratelimit-reset-tokens': '1m',
        'x-unrelated-header': 'ignored',
      },
    })) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await requestStructuredOutput({ apiKey: 'secret-fixture', model: 'model-fixture', timeoutMs: 100, fetchImpl }, request);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GroqHttpError);
    expect(caught).toMatchObject({
      status: 429,
      retryAfterSeconds: 3,
      rateLimitHeaders: {
        'x-ratelimit-limit-requests': '30',
        'x-ratelimit-remaining-requests': '0',
        'x-ratelimit-reset-requests': '2s',
        'x-ratelimit-limit-tokens': '6000',
        'x-ratelimit-remaining-tokens': '0',
        'x-ratelimit-reset-tokens': '1m',
      },
    });
    expect((caught as GroqHttpError).rateLimitHeaders).not.toHaveProperty('x-unrelated-header');
    expect(JSON.stringify(caught)).not.toContain('secret-fixture');
    expect(JSON.stringify(caught)).not.toContain('question-fixture');
    expect(JSON.stringify(caught)).not.toContain('stock');
  });

  it('mantiene el contrato exitoso existente', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ ok: true }) } }],
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(requestStructuredOutput({ apiKey: 'fixture', model: 'fixture', timeoutMs: 100, fetchImpl }, request))
      .resolves.toEqual({ ok: true });
  });
});
