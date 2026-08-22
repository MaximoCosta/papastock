import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';

const snapshot = { locations: [{ id: 'l', name: 'Sur', type: 'cold_storage' as const }], lots: [{ id: 'lot', code: 'A-204', variety: 'I', campaign: '25/26', producer: 'P', origin: 'O' }], stockRecords: [{ id: 's', lotId: 'lot', locationId: 'l', declaredQuantity: 2, verifiedQuantity: 1, updatedAt: '2026-08-21' }], movements: [], traceabilityEvents: [] };
const repository = {
  loadSnapshot: vi.fn(async () => snapshot),
  loadLot: vi.fn(async () => snapshot),
  insertTraceabilityEvent: vi.fn(async (event) => ({ id: 'generated', ...event })),
};
const analyze = vi.fn(async () => ({ engine: 'heuristic' as const, summary: 'x', confidence: 0.2, explainedQuantity: 0, unexplainedQuantity: 1, hypotheses: [], evidence: [], recommendedAction: 'Revisar.' }));
const app = createApp({ repository, analyze });

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
});
