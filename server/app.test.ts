import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';

const snapshot = {
  locations: [{ id: 'l', name: 'Sur', type: 'cold_storage' as const }],
  shelfUnits: [{ id: 'u', locationId: 'l', code: 'S-A', label: 'Rack A', gridRow: 0, gridCol: 0 }],
  shelves: [{ id: 'sh', locationId: 'l', shelfUnitId: 'u', code: 'S-A1', label: 'Rack A · N1', level: 1 }],
  lots: [{ id: 'lot', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O' }],
  stockRecords: [{ id: 's', lotId: 'lot', locationId: 'l', declaredQuantity: 2, verifiedQuantity: 1, updatedAt: '2026-08-21' }],
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
};
const analyze = vi.fn(async () => ({ engine: 'heuristic' as const, summary: 'x', confidence: 0.2, explainedQuantity: 0, unexplainedQuantity: 1, hypotheses: [], evidence: [], recommendedAction: 'Revisar.' }));
const parseMovementIntent = vi.fn(async () => ({ action: 'transfer' as const, lotCode: 'A-204', quantityKg: 500, origin: 'Sur', destination: 'Norte', engine: 'llm' as const }));
const app = createApp({ repository, analyze, parseMovementIntent });

describe('API PapaStock', () => {
  it('expone health exacto', async () => {
    expect((await request(app).get('/health').expect(200)).body).toEqual({ status: 'ok' });
  });

  it('entrega snapshot identificando PostgreSQL', async () => {
    expect((await request(app).get('/api/snapshot').expect(200)).body).toMatchObject({ source: 'database', data: { lots: [{ code: 'A-204' }] } });
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
});
