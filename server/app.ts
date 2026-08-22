import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { config } from './config';
import { pool } from './db/pool';
import { PapaStockRepository } from './repositories/papaStockRepository';
import { createDiscrepancyAnalyzer } from './services/groqDiscrepancy';

const identifier = z.string().min(1).max(120);
const discrepancyInputSchema = z.object({
  lot: z.object({ id: identifier, code: identifier }),
  stock: z.object({
    id: identifier,
    lotId: identifier,
    locationId: identifier,
    declaredQuantity: z.number().nonnegative(),
    verifiedQuantity: z.number().nonnegative(),
    updatedAt: z.string(),
    verificationPending: z.boolean().optional(),
  }),
  movements: z.array(z.object({
    id: identifier,
    lotId: identifier,
    originLocationId: identifier.optional(),
    destinationLocationId: identifier.optional(),
    quantity: z.number().positive(),
    date: z.string(),
    status: z.enum(['completed', 'pending', 'cancelled']),
    reference: identifier,
  })).max(100),
  traceability: z.array(z.object({
    id: identifier,
    lotId: identifier,
    type: z.enum(['planting', 'harvest', 'treatment', 'quality_control', 'stock_verification']),
    date: z.string(),
    locationId: identifier.optional(),
    data: z.record(z.string(), z.unknown()),
  })).max(100),
});

const traceabilityInputSchema = z.object({
  lotId: identifier,
  type: z.literal('treatment'),
  date: z.iso.date(),
  locationId: identifier.optional(),
  data: z.object({
    product: z.string().trim().min(1).max(120),
    sourceText: z.string().trim().max(500).optional(),
    origin: z.literal('operator_confirmation').optional(),
  }),
});

export interface AppDependencies {
  repository?: Pick<PapaStockRepository, 'loadSnapshot' | 'loadLot' | 'insertTraceabilityEvent'>;
  analyze?: ReturnType<typeof createDiscrepancyAnalyzer>;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const repository = dependencies.repository ?? (pool ? new PapaStockRepository(pool) : undefined);
  const analyze = dependencies.analyze ?? createDiscrepancyAnalyzer({
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs,
  });

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  app.get('/api/snapshot', async (_request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.json({ data: await repository.loadSnapshot(), source: 'database' });
    } catch (error) { next(error); }
  });

  app.get('/api/lots/:id', async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.json({ data: await repository.loadLot(request.params.id), source: 'database' });
    } catch (error) { next(error); }
  });

  app.post('/api/traceability', async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const event = traceabilityInputSchema.parse(request.body);
      response.status(201).json({ data: await repository.insertTraceabilityEvent(event) });
    } catch (error) { next(error); }
  });

  app.post('/api/ai/discrepancy', async (request, response, next) => {
    try {
      const input = discrepancyInputSchema.parse(request.body);
      response.json({ data: await analyze(input) });
    } catch (error) { next(error); }
  });

  app.use('/api', (_request, response) => response.status(404).json({ error: 'Endpoint no encontrado.' }));
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) return response.status(400).json({ error: 'Solicitud inválida.', details: z.treeifyError(error) });
    const candidate = error as { status?: number; code?: string; message?: string };
    const status = candidate.status ?? (candidate.code === '23505' ? 409 : 500);
    if (status >= 500) console.error('[api]', error);
    return response.status(status).json({ error: status >= 500 ? 'No se pudo completar la operación.' : candidate.message });
  });
  return app;
}
