import { describe, expect, it, vi } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { buildAiOperationsContext, createAiOperationsAssistant, measureAiOperationsContext } from './aiOperationsAssistant';

const snapshot: PapaStockSnapshot = {
  locations: [{ id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' }],
  shelfUnits: [], shelves: [], transporters: [],
  lots: [
    { id: 'lot-show-001', code: 'SHOW-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
    { id: 'lot-old', code: 'OLD-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
  ],
  stockRecords: [
    { id: 'stock-show', lotId: 'lot-show-001', locationId: 'loc-oriente', declaredQuantity: 8000, verifiedQuantity: 7900, unit: 'kg', updatedAt: '2026-08-24', verificationPending: false },
    { id: 'stock-old', lotId: 'lot-old', locationId: 'loc-oriente', declaredQuantity: 10, verifiedQuantity: 10, unit: 'kg', updatedAt: '2026-08-24', verificationPending: true },
  ],
  movements: [{
    id: 'movement-show-import', reference: 'SHOWCASE-IMPORT-001', destinationLocationId: 'loc-oriente',
    date: '2026-08-24', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
    items: [{ id: 'item-show', movementId: 'movement-show-import', lotId: 'lot-show-001', dispatchedQuantity: 8000, unit: 'kg', sortOrder: 0 }],
  }],
  traceabilityEvents: [], discrepancies: [], stockCounts: [],
};

const envelope = (content: unknown) => new Response(JSON.stringify({
  choices: [{ message: { content: JSON.stringify(content) } }],
}), { status: 200, headers: { 'content-type': 'application/json' } });

const validAnswer = (overrides: Record<string, unknown> = {}) => ({
  answer: 'Stock operativo registrado: 8.000 kg en Campo Oriente.',
  confidence: 'high',
  dataQuality: 'operational_only',
  entities: [{ type: 'lot', id: 'lot-show-001', label: 'SHOW-001' }],
  warnings: [],
  evidence: [{ source: 'stock_records', description: 'Registro stock-show.' }],
  ...overrides,
});

describe('asistente operativo read-only', () => {
  it('responde LOT_STOCK con hechos canónicos aunque Groq proponga el total verificado', async () => {
    const canonicalSnapshot: PapaStockSnapshot = {
      ...snapshot,
      locations: [
        ...snapshot.locations,
        { id: 'loc-frig-a', name: 'Frigorífico A', type: 'cold_storage' },
      ],
      stockRecords: [
        snapshot.stockRecords[0],
        {
          id: 'stock-show-frig', lotId: 'lot-show-001', locationId: 'loc-frig-a',
          declaredQuantity: 2_250, verifiedQuantity: 2_250, unit: 'kg',
          updatedAt: '2026-08-24', verificationPending: false,
        },
      ],
    };
    const fetchImpl = vi.fn(async () => envelope(validAnswer({
      answer: 'SHOW-001 tiene 10.150 kg de stock declarado.',
    }))) as unknown as typeof fetch;

    const answer = await createAiOperationsAssistant({ model: 'test', timeoutMs: 100, fetchImpl })(
      '¿Cuánto stock hay de SHOW-001?',
      buildAiOperationsContext('¿Cuánto stock hay de SHOW-001?', canonicalSnapshot),
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(answer.answer).toContain('10.250 kg de stock declarado');
    expect(answer.answer).toContain('10.150 kg');
    expect(answer.answer).toContain('-100 kg');
    expect(answer.answer).not.toContain('10.150 kg de stock declarado');
    expect(answer.entities).toEqual(expect.arrayContaining([
      { type: 'lot', id: 'lot-show-001', label: 'SHOW-001' },
      { type: 'location', id: 'loc-oriente', label: 'Campo Oriente' },
      { type: 'location', id: 'loc-frig-a', label: 'Frigorífico A' },
    ]));
  });

  it('comunica explícitamente una verificación pendiente en LOT_STOCK', async () => {
    const pendingSnapshot: PapaStockSnapshot = {
      ...snapshot,
      stockRecords: [{ ...snapshot.stockRecords[0], verifiedQuantity: 0, verificationPending: true }],
    };
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const answer = await createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      'Stock de SHOW-001', buildAiOperationsContext('Stock de SHOW-001', pendingSnapshot),
    );
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(`${answer.answer} ${answer.warnings.join(' ')}`).toContain('verificación pendiente');
  });

  it('construye contexto desde snapshot y distingue SHOW-* MATCH de la autoridad global', () => {
    const context = buildAiOperationsContext(snapshot, '2026-08-24T12:00:00.000Z');
    expect(context.timestamp).toBe('2026-08-24T12:00:00.000Z');
    expect(context.movementItems).toHaveLength(1);
    expect(context.ledger.ledgerAuthority).toBe(false);
    expect(context.ledger.classifications.find((item) => item.lotCode === 'SHOW-001')).toMatchObject({ classification: 'MATCH' });
    expect(context.ledger.classifications.find((item) => item.lotCode === 'OLD-001')).toMatchObject({ classification: 'MISSING_LEDGER_BALANCE' });
    expect(measureAiOperationsContext(context)).toMatchObject({
      counts: { lots: 2, stockRecords: 2, movements: 1, movementItems: 1 },
    });
    expect(measureAiOperationsContext(context).jsonBytes).toBeGreaterThan(0);
  });

  it('valida structured output, canonicaliza entidades y agrega warning de calidad', async () => {
    const fetchImpl = vi.fn(async () => envelope(validAnswer({
      entities: [{ type: 'lot', id: 'lot-show-001', label: 'etiqueta inventada' }],
    }))) as unknown as typeof fetch;
    const answer = await createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      '¿Cuánto stock hay de SHOW-001?', buildAiOperationsContext(snapshot),
    );
    expect(answer.entities).toEqual([{ type: 'lot', id: 'lot-show-001', label: 'SHOW-001' }]);
    expect(answer.warnings[0]).toContain('stock operativo persistido');
  });

  it('normaliza metadata authoritative cuando el texto es seguro y conserva el warning canónico', async () => {
    const fetchImpl = vi.fn(async () => envelope(validAnswer({ dataQuality: 'authoritative' }))) as unknown as typeof fetch;
    const answer = await createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      '¿Cuánto stock hay de SHOW-001?', buildAiOperationsContext(snapshot),
    );
    expect(answer.dataQuality).toBe('operational_only');
    expect(answer.answer).toContain('Stock operativo');
    expect(answer.warnings).toContain('El stock operativo persistido es la referencia actual; el historial de movimientos todavía no reconstruye todos los saldos.');
  });

  it.each([
    { entities: [{ type: 'lot', id: 'lot-inventado', label: 'X' }], dataQuality: 'operational_only', answer: 'X' },
    { entities: [], dataQuality: 'operational_only', answer: 'El ledger confirma todo el inventario.' },
    { entities: [], dataQuality: 'authoritative', answer: 'El ledger valida todos los saldos.' },
    { entities: [], dataQuality: 'operational_only', answer: 'El historial reconstruye completamente el inventario.' },
  ])('rechaza alucinaciones o autoridad inexistente', async (override) => {
    const fetchImpl = vi.fn(async () => envelope({
      answer: override.answer,
      confidence: 'high', dataQuality: override.dataQuality,
      entities: override.entities, warnings: [], evidence: [{ source: 'ledger', description: 'Ledger.' }],
    })) as unknown as typeof fetch;
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      'Resumen', buildAiOperationsContext(snapshot),
    )).rejects.toMatchObject({ status: 502 });
  });

  it('respeta Retry-After y hace como máximo un retry que puede completar normalmente', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '0' } }))
      .mockResolvedValueOnce(envelope(validAnswer())) as unknown as typeof fetch;
    const wait = vi.fn(async () => undefined);
    const answer = await createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl, wait })(
      'Resumen', buildAiOperationsContext(snapshot),
    );
    expect(answer.dataQuality).toBe('operational_only');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledOnce();
    expect(wait).toHaveBeenCalledWith(0);
  });

  it('devuelve 429 controlado después de un único retry y no entra en loop', async () => {
    const fetchImpl = vi.fn(async () => new Response('', {
      status: 429,
      headers: { 'retry-after': '0', 'x-ratelimit-remaining-tokens': '0' },
    })) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl, wait: async () => undefined })(
      'Resumen', buildAiOperationsContext(snapshot),
    )).rejects.toMatchObject({ status: 429, message: 'El asistente alcanzó un límite temporal. Reintentá en unos segundos.' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('no espera ni reintenta si Retry-After excede el timeout restante', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 429, headers: { 'retry-after': '2' } })) as unknown as typeof fetch;
    const wait = vi.fn(async () => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl, wait })(
      'Resumen', buildAiOperationsContext(snapshot),
    )).rejects.toMatchObject({ status: 429, details: { retryAfterSeconds: 2 } });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('no reintenta sin Retry-After y no expone secreto, pregunta ni contexto en el error o log', async () => {
    const secret = 'secret-fixture-value';
    const question = 'pregunta-confidencial-fixture';
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 })) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let caught: unknown;
    try {
      await createAiOperationsAssistant({ apiKey: secret, model: 'test', timeoutMs: 100, fetchImpl })(
        question, buildAiOperationsContext(snapshot),
      );
    } catch (error) {
      caught = error;
    }
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(JSON.stringify(caught)).not.toContain(secret);
    expect(JSON.stringify(caught)).not.toContain(question);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(secret);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(question);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('stock-show');
    warn.mockRestore();
  });

  it('devuelve error controlado cuando Groq falla, sin fallback inventado', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch;
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      'Resumen', buildAiOperationsContext(snapshot),
    )).rejects.toMatchObject({ status: 502, message: 'El asistente de inventario no está disponible en este momento.' });
  });

  it('diagnostica un 400 sin retry ni exposición de pregunta, contexto o secreto', async () => {
    const secret = 'secret-groq-400-fixture';
    const question = 'pregunta-privada-groq-400-fixture';
    const reflected = `${question} ${secret} stock-show`;
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'invalid_request_error', type: 'invalid_request', message: reflected },
    }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-safe-400' },
    })) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let caught: unknown;
    try {
      await createAiOperationsAssistant({ apiKey: secret, model: 'test', timeoutMs: 100, fetchImpl })(
        question, buildAiOperationsContext(question, snapshot),
      );
    } catch (error) {
      caught = error;
    }
    const logged = JSON.stringify(warn.mock.calls);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(caught).toMatchObject({
      status: 502,
      message: 'El asistente de inventario no está disponible en este momento.',
    });
    expect(logged).toContain('invalid_request_error');
    expect(logged).toContain('invalid_request');
    expect(logged).toContain('req-safe-400');
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain(question);
    expect(logged).not.toContain('stock-show');
    expect(JSON.stringify(caught)).not.toContain('req-safe-400');
    warn.mockRestore();
  });

  it('serializa LOT_HISTORY de forma determinística y dentro del presupuesto', async () => {
    const historySnapshot: PapaStockSnapshot = {
      locations: [
        { id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' },
        { id: 'loc-frig-a', name: 'Frigorífico A', type: 'cold_storage' },
      ],
      shelfUnits: [], shelves: [], transporters: [],
      lots: [snapshot.lots[0]],
      stockRecords: [
        snapshot.stockRecords[0],
        {
          id: 'stock-show-frig', lotId: 'lot-show-001', locationId: 'loc-frig-a',
          declaredQuantity: 2_250, verifiedQuantity: 2_250, unit: 'kg', updatedAt: '2026-08-24',
        },
      ],
      movements: [
        {
          id: 'movement-import', reference: 'SHOWCASE-IMPORT-001', destinationLocationId: 'loc-oriente',
          date: '2026-08-18', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
          items: [{ id: 'item-import', movementId: 'movement-import', lotId: 'lot-show-001', dispatchedQuantity: 10_000, unit: 'kg', sortOrder: 0 }],
        },
        {
          id: 'movement-transfer', reference: 'SHOWCASE-TRANSFER-001', originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a',
          date: '2026-08-20', status: 'completed', kind: 'transfer', receptionStatus: 'received',
          items: [{ id: 'item-transfer', movementId: 'movement-transfer', lotId: 'lot-show-001', dispatchedQuantity: 2_000, receivedQuantity: 2_000, unit: 'kg', sortOrder: 0 }],
        },
        {
          id: 'movement-correction', reference: 'SHOWCASE-CORRECTION-001', originLocationId: 'loc-frig-a', destinationLocationId: 'loc-frig-a',
          correctsMovementId: 'movement-transfer', date: '2026-08-22', status: 'completed', kind: 'correction', receptionStatus: 'not_applicable',
          items: [{ id: 'item-correction', movementId: 'movement-correction', lotId: 'lot-show-001', dispatchedQuantity: 250, unit: 'kg', sortOrder: 0, data: { effect: 'restore' } }],
        },
      ],
      traceabilityEvents: [
        { id: 'trace-correction', lotId: 'lot-show-001', type: 'correction', date: '2026-08-22', locationId: 'loc-frig-a', data: { source: 'showcase', unit: 'kg', reference: 'SHOWCASE-CORRECTION-001' } },
        { id: 'trace-verification', lotId: 'lot-show-001', type: 'stock_verification', date: '2026-08-23', locationId: 'loc-oriente', data: { source: 'showcase', verifiedQuantity: 7_900, origin: 'operator_confirmation' } },
      ],
      discrepancies: [], stockCounts: [],
    };
    let sentBody = '';
    const fetchImpl = vi.fn(async (_url, init) => {
      sentBody = String(init?.body ?? '');
      return new Response(JSON.stringify({ error: { code: 'fixture_400', type: 'invalid_request' } }), {
        status: 400, headers: { 'x-request-id': 'req-history-fixture' },
      });
    }) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const question = '¿Qué pasó con SHOW-001?';
    const context = buildAiOperationsContext(question, historySnapshot, '2026-08-24T12:00:00.000Z');
    await expect(createAiOperationsAssistant({
      apiKey: 'fixture', model: 'openai/gpt-oss-20b', timeoutMs: 100,
      maxRequestBodyBytes: 20_000, fetchImpl,
    })(question, context)).rejects.toMatchObject({ status: 502 });

    const payload = JSON.parse(sentBody) as Record<string, any>;
    const user = JSON.parse(payload.messages[1].content);
    expect(payload).toMatchObject({
      model: 'openai/gpt-oss-20b', temperature: 0,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'papastock_operations_answer', strict: true },
      },
      messages: [{ role: 'system' }, { role: 'user' }],
    });
    expect(user.context).toMatchObject({
      intent: 'LOT_HISTORY',
      movements: expect.any(Array), movementItems: expect.any(Array), traceability: expect.any(Array),
    });
    expect(user.context.movements).toHaveLength(3);
    expect(user.context.movementItems).toHaveLength(3);
    expect(user.context.traceability).toHaveLength(2);
    expect(user.context.ledger.classifications).toHaveLength(2);
    expect(Buffer.byteLength(sentBody, 'utf8')).toBeLessThan(20_000);
    expect(JSON.parse(JSON.stringify(user))).toEqual(user);
    warn.mockRestore();
  });

  it('trata 413 como no reintentable y preserva sólo diagnóstico seguro', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'request_too_large', type: 'tokens', message: 'Request exceeds the account token limit.' },
    }), { status: 413, headers: { 'content-type': 'application/json', 'content-length': '123' } })) as unknown as typeof fetch;
    const wait = vi.fn(async () => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl, wait })(
      'Resumen operativo',
      buildAiOperationsContext('Resumen operativo', snapshot),
    )).rejects.toMatchObject({ status: 413, details: { code: 'AI_UPSTREAM_REQUEST_TOO_LARGE' } });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).toContain('request_too_large');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('stock-show');
    warn.mockRestore();
  });

  it('no llama a Groq cuando el JSON final excede el presupuesto de bytes', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(createAiOperationsAssistant({
      apiKey: 'test', model: 'test', timeoutMs: 100, maxRequestBodyBytes: 100, fetchImpl,
    })(
      'Resumen operativo',
      buildAiOperationsContext('Resumen operativo', snapshot),
    )).rejects.toMatchObject({ status: 413, details: { code: 'AI_REQUEST_BODY_BUDGET_EXCEEDED' } });
    expect(fetchImpl).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
