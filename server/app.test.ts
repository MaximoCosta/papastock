import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';

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
  previewStockTransfer: vi.fn(async (intent) => ({ valid: true, errors: [], intent })),
  executeStockTransfer: vi.fn(async (intent) => ({
    id: 'movement-new', reference: 'MV-N01-TEST', lotId: 'lot',
    originLocationId: 'l', destinationLocationId: 'other', quantity: intent.quantityKg,
    date: '2026-08-22', status: 'completed' as const,
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
const parseMovementIntent = vi.fn(async () => ({ action: 'transfer' as const, lotCode: 'A-204', quantityKg: 500, origin: 'Sur', destination: 'Norte', engine: 'llm' as const }));
const parseTraceabilityIntent = vi.fn(async () => ({
  engine: 'llm' as const, type: 'treatment' as const, product: 'Mancozeb', date: '2026-08-18', confidence: 0.94,
}));
const parseExportRequirements = vi.fn(async () => ({
  engine: 'llm' as const, requirements: [{ key: 'treatment' as const, label: 'Tratamiento fitosanitario', required: true }],
}));
const app = createApp({ repository, analyze, parseMovementIntent, parseTraceabilityIntent, parseExportRequirements });

describe('API PapaStock', () => {
  it('expone health exacto', async () => {
    expect((await request(app).get('/health').expect(200)).body).toEqual({ status: 'ok' });
  });

  it('entrega snapshot identificando PostgreSQL', async () => {
    const payload = (await request(app).get('/api/snapshot').expect(200)).body;
    expect(payload.source).toBe('database');
    expect(payload.data.lots.map((lot: { code: string }) => lot.code)).toContain('A-204');
  });

  it('rechaza una mutación de trazabilidad fuera del contrato', async () => {
    await request(app).post('/api/traceability').send({ lotId: 'lot', type: 'harvest', date: '2026-08-20', data: {} }).expect(400);
  });

  it('devuelve análisis estructurado', async () => {
    const body = { lot: { id: 'lot', code: 'A-204' }, stock: { id: 's', lotId: 'lot', locationId: 'l', declaredQuantity: 2, verifiedQuantity: 1, updatedAt: 'x' }, movements: [], traceability: [] };
    expect((await request(app).post('/api/ai/discrepancy').send(body).expect(200)).body.data.engine).toBe('heuristic');
  });

  it('interpreta, previsualiza y confirma un movimiento en endpoints separados', async () => {
    const parsed = (await request(app).post('/api/ai/movement-intent').send({ text: 'Mové 500 kg del lote A-204 de Sur a Norte.' }).expect(200)).body.data;
    expect(parsed).toMatchObject({ engine: 'llm', lotCode: 'A-204', quantityKg: 500 });

    expect((await request(app).post('/api/movements/preview').send(parsed).expect(200)).body.data.valid).toBe(true);
    expect(repository.executeStockTransfer).not.toHaveBeenCalled();

    const created = (await request(app).post('/api/movements').send(parsed).expect(201)).body.data;
    expect(created).toMatchObject({ reference: 'MV-N01-TEST', status: 'completed' });
  });

  it('previsualiza una planilla sin escribir y confirma en un segundo paso', async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Remito', 'Fecha', 'Variedad', 'Lote', 'Kgs.', 'Transporte', 'Destino'],
      [1001, new Date('2026-03-09T00:00:00Z'), 'agata', 241, 35160, 'serantes-vera', 'dospanca'],
    ]), 'De campo a Frío');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const previewed = await request(app)
      .post('/api/imports/planilla/preview')
      .set('x-filename', encodeURIComponent('Planilla de movimientos 2026.xlsx'))
      .set('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(buffer)
      .expect(200);

    expect(previewed.body.data).toMatchObject({ valid: true, movementCount: 1 });
    expect(repository.executePlanillaImport).not.toHaveBeenCalled();

    const confirmed = await request(app)
      .post('/api/imports/planilla')
      .set('x-filename', encodeURIComponent('Planilla de movimientos 2026.xlsx'))
      .set('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(buffer)
      .expect(201);

    expect(confirmed.body.data).toMatchObject({ createdMovements: 1, persisted: true });
    expect(confirmed.body.data.applied.movements.length).toBeGreaterThan(0);
    expect(repository.executePlanillaImport).toHaveBeenCalledOnce();
  });

  it('lee un CSV sin base de datos y carga el preview', async () => {
    const csvApp = createApp({ analyze, parseMovementIntent });
    const csv = 'Remito,Fecha,Variedad,Lote,Kgs,Destino\n1001,2026-03-09,agata,241,35160,dospanca\n';
    const previewed = await request(csvApp)
      .post('/api/imports/planilla/preview')
      .set('x-filename', encodeURIComponent('movimientos.csv'))
      .set('content-type', 'text/csv')
      .send(Buffer.from(csv))
      .expect(200);
    expect(previewed.body.data).toMatchObject({ valid: true, movementCount: 1 });

    const confirmed = await request(csvApp)
      .post('/api/imports/planilla')
      .set('x-filename', encodeURIComponent('movimientos.csv'))
      .set('content-type', 'text/csv')
      .send(Buffer.from(csv))
      .expect(201);
    expect(confirmed.body.data.persisted).toBe(false);
    expect(confirmed.body.data.applied.lots.some((lot: { code: string }) => lot.code === '241')).toBe(true);
  });

  it('valida una carga de stock por formulario sin escribir y después la confirma', async () => {
    repository.executePlanillaImport.mockClear();
    const body = {
      lotCode: '241', variety: 'Agata', quantityKg: 35160, date: '2026-03-09',
      destination: 'Dos Panca', origin: 'Campo', remito: '1001', bags: 705,
    };
    const previewed = await request(app).post('/api/stock/intake/preview').send(body).expect(200);
    expect(previewed.body.data).toMatchObject({ valid: true, movementCount: 1 });
    expect(repository.executePlanillaImport).not.toHaveBeenCalled();

    const confirmed = await request(app).post('/api/stock/intake').send(body).expect(201);
    expect(confirmed.body.data).toMatchObject({ createdMovements: 1, persisted: true });
    expect(repository.executePlanillaImport).toHaveBeenCalledOnce();
  });

  it('rechaza verificar el lote de demo A-204', async () => {
    await request(app).post('/api/stock/verify').send({
      stockRecordId: 's', countedQuantity: 25000, date: '2026-08-22',
    }).expect(400);
    expect(repository.executeStockVerification).not.toHaveBeenCalled();
  });

  it('confirma una verificación de stock sobre un lote operativo', async () => {
    const body = { stockRecordId: 's-g', countedQuantity: 21000, date: '2026-08-22', bags: 420 };
    const confirmed = await request(app).post('/api/stock/verify').send(body).expect(201);
    expect(confirmed.body.data).toMatchObject({
      persisted: true,
      correction: { stockRecordId: 's-g', countedQuantity: 21000 },
    });
    expect(repository.executeStockVerification).toHaveBeenCalledOnce();
  });

  it('interpreta trazabilidad sin escribirla', async () => {
    const body = { text: 'El lote fue tratado con Mancozeb el 18 de agosto de 2026.', lotId: 'lot-a310' };
    const data = (await request(app).post('/api/ai/traceability-intent').send(body).expect(200)).body.data;
    expect(data).toMatchObject({ engine: 'llm', product: 'Mancozeb', date: '2026-08-18' });
    expect(repository.insertTraceabilityEvent).not.toHaveBeenCalled();
  });

  it('rechaza una interpretación de trazabilidad sin lotId', async () => {
    await request(app).post('/api/ai/traceability-intent').send({ text: 'Tratamiento con Mancozeb.' }).expect(400);
  });

  it('devuelve requisitos documentales estructurados', async () => {
    const body = { country: 'Brasil', documentType: 'proforma', sourceText: 'Debe incluir tratamiento fitosanitario.' };
    const data = (await request(app).post('/api/ai/export-requirements').send(body).expect(200)).body.data;
    expect(data).toMatchObject({ engine: 'llm', requirements: [{ key: 'treatment' }] });
  });
});
