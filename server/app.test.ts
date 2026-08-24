import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Express } from 'express';
import { createApp } from './app';
import { AuthService, hashPassword } from './auth';

const TEST_USERNAME = 'operador-test';
const TEST_PASSWORD = 'una-clave-segura-de-prueba';
const TEST_HOST = 'papastock.test';
const TEST_ORIGIN = `http://${TEST_HOST}`;
const auth = new AuthService({
  username: TEST_USERNAME,
  passwordHash: hashPassword(TEST_PASSWORD, Buffer.alloc(16, 7)),
  sessionSecret: 'test-session-secret-with-at-least-32-characters',
  secureCookies: false,
});
let sessionCookie = '';
let sessionCookieHeader = '';

function protectedGet(target: Express, path: string) {
  return request(target).get(path).set('cookie', sessionCookie);
}

function protectedPost(target: Express, path: string) {
  return request(target).post(path)
    .set('host', TEST_HOST)
    .set('origin', TEST_ORIGIN)
    .set('cookie', sessionCookie);
}

const snapshot = {
  locations: [{ id: 'l', name: 'Sur', type: 'cold_storage' as const }],
  shelfUnits: [{ id: 'u', locationId: 'l', code: 'S-A', label: 'Rack A', gridRow: 0, gridCol: 0 }],
  shelves: [{ id: 'sh', locationId: 'l', shelfUnitId: 'u', code: 'S-A1', label: 'Rack A · N1', level: 1 }],
  lots: [
    { id: 'lot', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O' },
    { id: 'lot-g', code: 'G-512', variety: 'Spunta', campaign: '25/26', producer: 'P', origin: 'O' },
  ],
  stockRecords: [
    { id: 's', lotId: 'lot', locationId: 'l', declaredQuantity: 2, verifiedQuantity: 1, updatedAt: '2026-08-21' },
    { id: 's-g', lotId: 'lot-g', locationId: 'l', declaredQuantity: 21000, verifiedQuantity: 0, verificationPending: true, updatedAt: '2026-08-21' },
  ],
  movements: [],
  transporters: [],
  traceabilityEvents: [],
};
const repository = {
  loadSnapshot: vi.fn(async () => snapshot),
  loadLot: vi.fn(async () => snapshot),
  insertTraceabilityEvent: vi.fn(async (event) => ({ id: 'generated', ...event })),
  previewStockTransfer: vi.fn(async (intent) => ({ valid: true, errors: [], intent, lines: [] })),
  executeStockTransfer: vi.fn(async (intent) => ({
    id: 'movement-new', reference: 'MV-N01-TEST', lotId: 'lot',
    originLocationId: 'l', destinationLocationId: 'other',
    quantity: intent.items?.[0]?.quantity ?? intent.quantityKg,
    date: '2026-08-22', status: 'completed' as const,
    items: intent.items?.map((item: { lotCode: string; quantity: number; unit: 'kg' | 'bags' }, index: number) => ({
      id: `item-${index}`, movementId: 'movement-new', lotId: 'lot', dispatchedQuantity: item.quantity, unit: item.unit, sortOrder: index,
    })),
  })),
  executeReception: vi.fn(async () => ({
    movement: {
      id: 'movement-new', reference: 'MV-N01-TEST', date: '2026-08-22', status: 'completed' as const,
    },
    discrepancies: [],
  })),
  executeLotCorrection: vi.fn(async () => ({
    id: 'movement-cor', reference: 'MV-COR-TEST', date: '2026-08-22', status: 'completed' as const,
  })),
  executeStockCount: vi.fn(async () => ({
    count: {
      id: 'count-1', locationId: 'l', lotId: 'lot', expectedQuantity: 900,
      observedQuantity: 880, unit: 'bags' as const, difference: -20, countedAt: '2026-08-22',
    },
  })),
  executePlanillaImport: vi.fn(async () => ({
    createdLocations: 2, createdLots: 1, createdMovements: 1, skippedMovements: 0, upsertedStockRecords: 1,
  })),
  executeStockVerification: vi.fn(async (input) => ({
    persisted: true,
    correction: {
      stockRecordId: input.stockRecordId,
      lotCode: 'G-512',
      countedQuantity: input.countedQuantity,
      previousVerified: 0,
    },
    event: {
      id: 'trace-verify', lotId: 'lot-g', type: 'stock_verification' as const,
      date: input.date, locationId: 'l', data: { verifiedQuantity: input.countedQuantity },
    },
  })),
};
const analyze = vi.fn(async () => ({ engine: 'heuristic' as const, summary: 'x', confidence: 0.2, explainedQuantity: 0, unexplainedQuantity: 1, hypotheses: [], evidence: [], recommendedAction: 'Revisar.' }));
const parseMovementIntent = vi.fn(async () => ({
  action: 'transfer' as const,
  lotCode: 'A-204',
  quantityKg: 500,
  origin: 'Sur',
  destination: 'Norte',
  items: [{ lotCode: 'A-204', quantity: 500, unit: 'kg' as const }],
  engine: 'llm' as const,
}));
const parseTraceabilityIntent = vi.fn(async () => ({
  engine: 'llm' as const, type: 'treatment' as const, product: 'Mancozeb', date: '2026-08-18', confidence: 0.94,
}));
const parseExportRequirements = vi.fn(async () => ({
  engine: 'llm' as const, requirements: [{ key: 'treatment' as const, label: 'Tratamiento fitosanitario', required: true }],
}));
const answerOperationsQuestion = vi.fn(async () => ({
  answer: 'SHOW-001 tiene 8.000 kg registrados.', confidence: 'high' as const,
  dataQuality: 'operational_only' as const,
  entities: [{ type: 'lot' as const, id: 'lot', label: 'A-204' }],
  warnings: ['El ledger todavía no es autoritativo.'],
  evidence: [{ source: 'stock_records' as const, description: 'Registro s.' }],
}));
const app = createApp({ repository, analyze, parseMovementIntent, parseTraceabilityIntent, parseExportRequirements, answerOperationsQuestion, auth });

describe('API PapaStock', () => {
  beforeAll(async () => {
    const response = await request(app).post('/api/auth/login')
      .set('host', TEST_HOST)
      .set('origin', TEST_ORIGIN)
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD })
      .expect(200);
    const setCookie = response.headers['set-cookie'];
    sessionCookieHeader = (Array.isArray(setCookie) ? setCookie[0] : setCookie) ?? '';
    sessionCookie = sessionCookieHeader.split(';')[0] ?? '';
  });

  it('expone health exacto', async () => {
    expect((await request(app).get('/health').expect(200)).body).toEqual({ status: 'ok' });
  });

  it('separa readiness de liveness sin exponer el error de PostgreSQL', async () => {
    const ready = createApp({ auth, checkReadiness: vi.fn(async () => undefined) });
    expect((await request(ready).get('/ready').expect(200)).body).toEqual({ status: 'ready' });

    const unavailable = createApp({
      auth,
      checkReadiness: vi.fn(async () => { throw new Error('postgres://usuario:secreto@host/db'); }),
    });
    const response = await request(unavailable).get('/ready').expect(503);
    expect(response.body).toEqual({ status: 'unavailable' });
    expect(JSON.stringify(response.body)).not.toContain('secreto');
  });

  it('protege todos los endpoints operativos sin sesión', async () => {
    const routes = [
      ['GET', '/api/snapshot'],
      ['GET', '/api/lots/lot'],
      ['POST', '/api/traceability'],
      ['POST', '/api/ai/discrepancy'],
      ['POST', '/api/ai/movement-intent'],
      ['POST', '/api/ai/traceability-intent'],
      ['POST', '/api/ai/export-requirements'],
      ['POST', '/api/ai/operations'],
      ['POST', '/api/movements/preview'],
      ['POST', '/api/movements'],
      ['POST', '/api/movements/movement/reception'],
      ['POST', '/api/movements/corrections'],
      ['POST', '/api/stock-counts'],
      ['POST', '/api/imports/planilla/preview'],
      ['POST', '/api/imports/planilla'],
      ['POST', '/api/stock/intake/preview'],
      ['POST', '/api/stock/intake'],
      ['POST', '/api/stock/verify'],
    ] as const;

    for (const [method, path] of routes) {
      const call = method === 'GET' ? request(app).get(path) : request(app).post(path);
      if (method === 'POST') call.set('host', TEST_HOST).set('origin', TEST_ORIGIN);
      await call.expect(401);
    }
  });

  it('emite una cookie HttpOnly SameSite=Strict sin exponer el token en el body', () => {
    expect(sessionCookieHeader).toContain('HttpOnly');
    expect(sessionCookieHeader).toContain('SameSite=Strict');
    expect(sessionCookieHeader).toContain('Path=/');
    expect(sessionCookieHeader).not.toContain('Domain=');
  });

  it('marca Secure cuando el servicio está configurado para producción', async () => {
    const secureAuth = new AuthService({
      username: TEST_USERNAME,
      passwordHash: hashPassword(TEST_PASSWORD, Buffer.alloc(16, 8)),
      sessionSecret: 'another-test-session-secret-with-32-characters',
      secureCookies: true,
    });
    const secureApp = createApp({ auth: secureAuth });
    const response = await request(secureApp).post('/api/auth/login')
      .set('host', TEST_HOST)
      .set('origin', `https://${TEST_HOST}`)
      .set('x-forwarded-proto', 'https')
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD })
      .expect(200);
    const header = response.headers['set-cookie'];
    expect(Array.isArray(header) ? header[0] : header).toContain('Secure');
  });

  it('aplica autorización además de autenticar', async () => {
    const limited = auth.createSession({
      username: 'lector', name: 'Lector', role: 'operator', plant: 'Planta Balcarce', permissions: ['data:read'],
    });
    await request(app).post('/api/stock-counts')
      .set('host', TEST_HOST)
      .set('origin', TEST_ORIGIN)
      .set('cookie', `papastock_session=${limited.token}`)
      .send({})
      .expect(403);
  });

  it('entrega snapshot identificando PostgreSQL', async () => {
    const payload = (await protectedGet(app, '/api/snapshot').expect(200)).body;
    expect(payload.source).toBe('database');
    expect(payload.data.lots.map((lot: { code: string }) => lot.code)).toContain('A-204');
  });

  it('rechaza una mutación de trazabilidad fuera del contrato', async () => {
    await protectedPost(app, '/api/traceability').send({ lotId: 'lot', type: 'harvest', date: '2026-08-20', data: {} }).expect(400);
  });

  it('devuelve análisis estructurado', async () => {
    const body = { lot: { id: 'lot', code: 'A-204' }, stock: { id: 's', lotId: 'lot', locationId: 'l', declaredQuantity: 2, verifiedQuantity: 1, updatedAt: 'x' }, movements: [], traceability: [] };
    expect((await protectedPost(app, '/api/ai/discrepancy').send(body).expect(200)).body.data.engine).toBe('heuristic');
  });

  it('interpreta, previsualiza y confirma un movimiento en endpoints separados', async () => {
    const parsed = (await protectedPost(app, '/api/ai/movement-intent').send({ text: 'Mové 500 kg del lote A-204 de Sur a Norte.' }).expect(200)).body.data;
    expect(parsed).toMatchObject({ engine: 'llm', items: [{ lotCode: 'A-204', quantity: 500, unit: 'kg' }] });

    expect((await protectedPost(app, '/api/movements/preview').send(parsed).expect(200)).body.data.valid).toBe(true);
    expect(repository.executeStockTransfer).not.toHaveBeenCalled();

    const created = (await protectedPost(app, '/api/movements').send(parsed).expect(201)).body.data;
    expect(created).toMatchObject({ reference: 'MV-N01-TEST', status: 'completed' });
  });

  it('exige y transporta Idempotency-Key para recepciones', async () => {
    const body = { date: '2026-08-23', receivedTotal: 10, unit: 'kg' };
    await protectedPost(app, '/api/movements/movement-new/reception').send(body).expect(400);
    expect(repository.executeReception).not.toHaveBeenCalled();

    await protectedPost(app, '/api/movements/movement-new/reception')
      .set('Idempotency-Key', 'receipt-api-test-0001')
      .send(body)
      .expect(201);
    expect(repository.executeReception).toHaveBeenCalledWith({
      movementId: 'movement-new',
      idempotencyKey: 'receipt-api-test-0001',
      ...body,
    });
  });

  it('previsualiza una planilla sin escribir y confirma en un segundo paso', async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Remito', 'Fecha', 'Variedad', 'Lote', 'Kgs.', 'Transporte', 'Destino'],
      [1001, new Date('2026-03-09T00:00:00Z'), 'agata', 241, 35160, 'serantes-vera', 'dospanca'],
    ]), 'De campo a Frío');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const previewed = await protectedPost(app, '/api/imports/planilla/preview')
      .set('x-filename', encodeURIComponent('Planilla de movimientos 2026.xlsx'))
      .set('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(buffer)
      .expect(200);

    expect(previewed.body.data).toMatchObject({ valid: true, movementCount: 1 });
    expect(repository.executePlanillaImport).not.toHaveBeenCalled();

    const confirmed = await protectedPost(app, '/api/imports/planilla')
      .set('x-filename', encodeURIComponent('Planilla de movimientos 2026.xlsx'))
      .set('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(buffer)
      .expect(201);

    expect(confirmed.body.data).toMatchObject({ createdMovements: 1, persisted: true });
    expect(confirmed.body.data.applied.movements.length).toBeGreaterThan(0);
    expect(repository.executePlanillaImport).toHaveBeenCalledOnce();
  });

  it('deshabilita uploads de planilla antes de leer el body cuando la política de producción está activa', async () => {
    const disabled = createApp({
      repository,
      analyze,
      parseMovementIntent,
      parseTraceabilityIntent,
      parseExportRequirements,
      auth,
      planillaUploadsEnabled: false,
    });
    repository.loadSnapshot.mockClear();
    const response = await protectedPost(disabled, '/api/imports/planilla/preview')
      .set('x-filename', encodeURIComponent('movimientos.csv'))
      .set('content-type', 'text/csv')
      .send(Buffer.from('Lote,Kgs\nA-204,10\n'))
      .expect(503);
    expect(response.body.error).toContain('temporalmente deshabilitada');
    expect(repository.loadSnapshot).not.toHaveBeenCalled();
  });

  it('no activa un snapshot demo implícito cuando falta la base', async () => {
    const csvApp = createApp({ analyze, parseMovementIntent, auth });
    const csv = 'Remito,Fecha,Variedad,Lote,Kgs,Destino\n1001,2026-03-09,agata,241,35160,dospanca\n';
    const previewed = await protectedPost(csvApp, '/api/imports/planilla/preview')
      .set('x-filename', encodeURIComponent('movimientos.csv'))
      .set('content-type', 'text/csv')
      .send(Buffer.from(csv))
      .expect(503);
    expect(previewed.body.error).toBe('No se pudo completar la operación.');

    const confirmed = await protectedPost(csvApp, '/api/imports/planilla')
      .set('x-filename', encodeURIComponent('movimientos.csv'))
      .set('content-type', 'text/csv')
      .send(Buffer.from(csv))
      .expect(503);
    expect(confirmed.body.error).toBe('No se pudo completar la operación.');
  });

  it('valida una carga de stock por formulario sin escribir y después la confirma', async () => {
    repository.executePlanillaImport.mockClear();
    const body = {
      lotCode: '241', variety: 'Agata', quantityKg: 35160, date: '2026-03-09',
      destination: 'Dos Panca', origin: 'Campo', remito: '1001', bags: 705,
    };
    const previewed = await protectedPost(app, '/api/stock/intake/preview').send(body).expect(200);
    expect(previewed.body.data).toMatchObject({ valid: true, movementCount: 1 });
    expect(repository.executePlanillaImport).not.toHaveBeenCalled();

    const confirmed = await protectedPost(app, '/api/stock/intake').send(body).expect(201);
    expect(confirmed.body.data).toMatchObject({ createdMovements: 1, persisted: true });
    expect(repository.executePlanillaImport).toHaveBeenCalledOnce();
  });

  it('permite verificar A-204 sin una excepción server-side de demo', async () => {
    await protectedPost(app, '/api/stock/verify').send({
      stockRecordId: 's', expectedVersion: 0, countedQuantity: 25000, date: '2026-08-22',
    }).expect(201);
    expect(repository.executeStockVerification).toHaveBeenCalledOnce();
    repository.executeStockVerification.mockClear();
  });

  it('confirma una verificación de stock sobre un lote operativo', async () => {
    const body = { stockRecordId: 's-g', expectedVersion: 0, countedQuantity: 21000, date: '2026-08-22', bags: 420 };
    const confirmed = await protectedPost(app, '/api/stock/verify').send(body).expect(201);
    expect(confirmed.body.data).toMatchObject({
      persisted: true,
      correction: { stockRecordId: 's-g', countedQuantity: 21000 },
    });
    expect(repository.executeStockVerification).toHaveBeenCalledOnce();
  });

  it('interpreta trazabilidad sin escribirla', async () => {
    const body = { text: 'El lote fue tratado con Mancozeb el 18 de agosto de 2026.', lotId: 'lot-a310' };
    const data = (await protectedPost(app, '/api/ai/traceability-intent').send(body).expect(200)).body.data;
    expect(data).toMatchObject({ engine: 'llm', product: 'Mancozeb', date: '2026-08-18' });
    expect(repository.insertTraceabilityEvent).not.toHaveBeenCalled();
  });

  it('rechaza una interpretación de trazabilidad sin lotId', async () => {
    await protectedPost(app, '/api/ai/traceability-intent').send({ text: 'Tratamiento con Mancozeb.' }).expect(400);
  });

  it('devuelve requisitos documentales estructurados', async () => {
    const body = { country: 'Brasil', documentType: 'proforma', sourceText: 'Debe incluir tratamiento fitosanitario.' };
    const data = (await protectedPost(app, '/api/ai/export-requirements').send(body).expect(200)).body.data;
    expect(data).toMatchObject({ engine: 'llm', requirements: [{ key: 'treatment' }] });
  });

  it('consulta el asistente read-only usando el snapshot PostgreSQL y permanece detrás de auth', async () => {
    repository.loadSnapshot.mockClear();
    repository.insertTraceabilityEvent.mockClear();
    repository.executeStockTransfer.mockClear();
    repository.executeReception.mockClear();
    repository.executeLotCorrection.mockClear();
    repository.executeStockCount.mockClear();
    repository.executePlanillaImport.mockClear();
    repository.executeStockVerification.mockClear();
    const data = (await protectedPost(app, '/api/ai/operations')
      .send({ question: '¿Cuánto stock hay de A-204?' })
      .expect(200)).body.data;
    expect(data).toMatchObject({ dataQuality: 'operational_only', confidence: 'high' });
    expect(repository.loadSnapshot).toHaveBeenCalledOnce();
    expect(answerOperationsQuestion).toHaveBeenCalledOnce();
    const assistantCall = answerOperationsQuestion.mock.calls.at(-1) as unknown as [string, unknown];
    expect(assistantCall[1]).toMatchObject({
      intent: 'LOT_STOCK',
      lots: [{ id: 'lot', code: 'A-204' }],
    });
    expect(repository.insertTraceabilityEvent).not.toHaveBeenCalled();
    expect(repository.executeStockTransfer).not.toHaveBeenCalled();
    expect(repository.executeReception).not.toHaveBeenCalled();
    expect(repository.executeLotCorrection).not.toHaveBeenCalled();
    expect(repository.executeStockCount).not.toHaveBeenCalled();
    expect(repository.executePlanillaImport).not.toHaveBeenCalled();
    expect(repository.executeStockVerification).not.toHaveBeenCalled();
    await protectedPost(app, '/api/ai/operations').send({ question: 'x' }).expect(400);
  });

  it('preserva un rate limit temporal del asistente como HTTP 429 controlado', async () => {
    answerOperationsQuestion.mockRejectedValueOnce(Object.assign(
      new Error('El asistente alcanzó un límite temporal. Reintentá en unos segundos.'),
      { status: 429, details: { retryAfterSeconds: 2 } },
    ));
    const response = await protectedPost(app, '/api/ai/operations')
      .send({ question: '¿Cuánto stock hay de SHOW-001?' })
      .expect(429);
    expect(response.headers['retry-after']).toBe('2');
    expect(response.body).toEqual({
      error: 'El asistente alcanzó un límite temporal. Reintentá en unos segundos.',
      details: { retryAfterSeconds: 2 },
    });
  });

  it('preserva un 413 controlado del asistente sin exponer contenido', async () => {
    answerOperationsQuestion.mockRejectedValueOnce(Object.assign(
      new Error('La consulta excede el límite seguro del asistente. Refiná la pregunta o contactá al administrador.'),
      { status: 413, details: { code: 'AI_REQUEST_BODY_BUDGET_EXCEEDED' } },
    ));
    const response = await protectedPost(app, '/api/ai/operations')
      .send({ question: '¿Cuánto stock hay de SHOW-001?' })
      .expect(413);
    expect(response.body).toEqual({
      error: 'La consulta excede el límite seguro del asistente. Refiná la pregunta o contactá al administrador.',
      details: { code: 'AI_REQUEST_BODY_BUDGET_EXCEEDED' },
    });
    expect(JSON.stringify(response.body)).not.toContain('SHOW-001');
  });

  it('devuelve 502 controlado sin exponer el diagnóstico interno de Groq', async () => {
    answerOperationsQuestion.mockRejectedValueOnce(Object.assign(
      new Error('El asistente de inventario no está disponible en este momento.'),
      { status: 502 },
    ));
    const response = await protectedPost(app, '/api/ai/operations')
      .send({ question: '¿Qué pasó con SHOW-001?' })
      .expect(502);
    expect(response.body).toEqual({
      error: 'No se pudo completar la operación.',
    });
    expect(JSON.stringify(response.body)).not.toContain('Groq');
    expect(JSON.stringify(response.body)).not.toContain('x-request-id');
    expect(JSON.stringify(response.body)).not.toContain('SHOW-001');
  });

  it('rechaza mutaciones cross-site incluso con sesión y el logout invalida la sesión', async () => {
    await request(app).post('/api/stock-counts')
      .set('host', TEST_HOST)
      .set('origin', 'https://attacker.example')
      .set('cookie', sessionCookie)
      .send({})
      .expect(403);

    await protectedPost(app, '/api/auth/logout').expect(204);
    await protectedGet(app, '/api/snapshot').expect(401);
  });
});
