import { describe, expect, it, vi } from 'vitest';
import {
  GroqHttpError,
  GroqRequestBodyLimitError,
  requestStructuredOutput,
  serializeStructuredRequest,
} from './groqStructured';

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

  it('calcula requestBodyBytes sobre el JSON final exacto enviado', async () => {
    let sentBody = '';
    const fetchImpl = vi.fn(async (_url, init) => {
      sentBody = String(init?.body ?? '');
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ ok: true }) } }],
      }), { status: 200 });
    }) as unknown as typeof fetch;
    const serialized = serializeStructuredRequest('model-fixture', request);
    await requestStructuredOutput({ apiKey: 'fixture', model: 'model-fixture', timeoutMs: 100, fetchImpl }, request);
    expect(sentBody).toBe(serialized.body);
    expect(serialized.metrics.requestBodyBytes).toBe(Buffer.byteLength(sentBody, 'utf8'));
    expect(serialized.metrics).toMatchObject({
      systemPromptBytes: Buffer.byteLength('system-fixture', 'utf8'),
      schemaBytes: Buffer.byteLength(JSON.stringify(request.jsonSchema), 'utf8'),
    });
  });

  it('bloquea localmente un body sobre presupuesto antes del fetch', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(requestStructuredOutput({
      apiKey: 'fixture', model: 'model-fixture', timeoutMs: 100, maxRequestBodyBytes: 10, fetchImpl,
    }, request)).rejects.toBeInstanceOf(GroqRequestBodyLimitError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('preserva diagnóstico seguro de un 413 sin conservar el body completo', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'request_too_large', type: 'tokens', message: 'Requested 7282 tokens; limit 6000.' },
      ignored: 'sensitive-context-fixture',
    }), {
      status: 413,
      headers: { 'content-type': 'application/json', 'content-length': '147', 'x-unrelated-header': 'ignored' },
    })) as unknown as typeof fetch;
    let caught: unknown;
    try {
      await requestStructuredOutput({ apiKey: 'fixture', model: 'model-fixture', timeoutMs: 100, fetchImpl }, request);
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({
      status: 413,
      responseError: { code: 'request_too_large', type: 'tokens' },
      safeHeaders: { 'content-type': 'application/json', 'content-length': '147' },
    });
    expect((caught as GroqHttpError).responseError).not.toHaveProperty('message');
    expect((caught as GroqHttpError).safeHeaders).not.toHaveProperty('x-unrelated-header');
    expect(JSON.stringify(caught)).not.toContain('sensitive-context-fixture');
  });

  it('preserva code json_validate_failed, type y x-request-id de un 400 y omite el message', async () => {
    const reflected = 'question-fixture context-fixture secret-fixture';
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'json_validate_failed', type: 'invalid_request_error', message: reflected },
    }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req_01m0wc309ye5g82dkddfhs57n7' },
    })) as unknown as typeof fetch;
    let caught: unknown;
    try {
      await requestStructuredOutput({ apiKey: 'secret-fixture', model: 'model-fixture', timeoutMs: 100, fetchImpl }, request);
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({
      status: 400,
      responseError: { code: 'json_validate_failed', type: 'invalid_request_error' },
      safeHeaders: { 'content-type': 'application/json', 'x-request-id': 'req_01m0wc309ye5g82dkddfhs57n7' },
    });
    expect((caught as GroqHttpError).responseError).not.toHaveProperty('message');
    expect(JSON.stringify(caught)).not.toContain(reflected);
    expect(JSON.stringify(caught)).not.toContain('secret-fixture');
  });

  it('preserva code, type y x-request-id de un 400 y omite mensajes potencialmente reflejados', async () => {
    const reflected = 'question-fixture context-fixture secret-fixture';
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'invalid_request_error', type: 'invalid_request', message: reflected },
    }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-safe-fixture' },
    })) as unknown as typeof fetch;
    let caught: unknown;
    try {
      await requestStructuredOutput({ apiKey: 'secret-fixture', model: 'model-fixture', timeoutMs: 100, fetchImpl }, request);
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({
      status: 400,
      responseError: { code: 'invalid_request_error', type: 'invalid_request' },
      safeHeaders: { 'content-type': 'application/json', 'x-request-id': 'req-safe-fixture' },
    });
    expect((caught as GroqHttpError).responseError).not.toHaveProperty('message');
    expect(JSON.stringify(caught)).not.toContain(reflected);
    expect(JSON.stringify(caught)).not.toContain('secret-fixture');
  });

  it('acepta JSON envuelto en fences markdown', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: '```json\n{"ok":true}\n```' } }],
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(requestStructuredOutput({ apiKey: 'fixture', model: 'fixture', timeoutMs: 100, fetchImpl }, request))
      .resolves.toEqual({ ok: true });
  });

  it('traduce el abort del timeout a un error explícito', async () => {
    const fetchImpl = vi.fn(async (_url, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    })) as unknown as typeof fetch;
    await expect(requestStructuredOutput({ apiKey: 'fixture', model: 'fixture', timeoutMs: 20, fetchImpl }, request))
      .rejects.toThrow(/timeout de 20 ms/);
  });
});
