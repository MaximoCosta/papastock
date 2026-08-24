import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { AuthService, requireAuthentication, requirePermission, requireSameOrigin } from './auth';
import { config } from './config';
import { pool, verifyDatabaseReadiness } from './db/pool';
import { PapaStockRepository } from './repositories/papaStockRepository';
import { createDiscrepancyAnalyzer } from './services/groqDiscrepancy';
import { createExportRequirementsParser } from './services/groqExportRequirements';
import { createMovementIntentParser } from './services/groqMovementIntent';
import { createTraceabilityIntentParser } from './services/groqTraceabilityIntent';
import { buildAiOperationsContext, createAiOperationsAssistant } from './services/aiOperationsAssistant';
import {
  buildPlanillaImportFromFile,
  buildStockIntakePlan,
  materializePlanillaImport,
  PLANILLA_LIMITS,
  validatePlanillaUpload,
} from './services/planillaImport';
import { getStockViews } from '../src/services/stockService';
import { buildStockVerificationPreview, toStockVerificationConfirmation } from '../src/lib/stockVerification';

const identifier = z.string().min(1).max(120);
const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(500),
});
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
    lotId: identifier.optional(),
    originLocationId: identifier.optional(),
    destinationLocationId: identifier.optional(),
    quantity: z.number().nonnegative().optional(),
    date: z.string(),
    status: z.enum(['completed', 'pending', 'cancelled']),
    reference: identifier,
    remitoNumber: z.string().optional(),
    items: z.array(z.object({
      id: identifier,
      movementId: identifier,
      lotId: identifier,
      dispatchedQuantity: z.number().positive(),
      unit: z.enum(['kg', 'bags']),
      sortOrder: z.number().int().default(0),
    })).optional(),
  })).max(100),
  traceability: z.array(z.object({
    id: identifier,
    lotId: identifier,
    type: z.enum(['planting', 'harvest', 'treatment', 'quality_control', 'stock_verification', 'reception', 'correction', 'physical_count', 'discrepancy']),
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

const optionalText = (max: number) => z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(max).optional(),
);

const movementTextSchema = z.object({
  text: z.string().trim().min(8).max(500),
});

const movementItemInputSchema = z.object({
  lotCode: identifier.max(40),
  quantity: z.number().positive().max(1_000_000),
  unit: z.enum(['bags', 'kg']),
});

const movementIntentSchema = z.union([
  z.object({
    action: z.literal('transfer'),
    remitoNumber: z.string().trim().max(40).optional(),
    origin: identifier,
    destination: identifier,
    items: z.array(movementItemInputSchema).min(1).max(50),
  }),
  z.object({
    action: z.literal('transfer'),
    lotCode: identifier.max(40),
    quantityKg: z.number().positive().max(1_000_000),
    origin: identifier,
    destination: identifier,
    remitoNumber: z.string().trim().max(40).optional(),
  }).transform((value) => ({
    action: 'transfer' as const,
    remitoNumber: value.remitoNumber,
    origin: value.origin,
    destination: value.destination,
    items: [{ lotCode: value.lotCode, quantity: value.quantityKg, unit: 'kg' as const }],
    lotCode: value.lotCode,
    quantityKg: value.quantityKg,
  })),
]);

const receptionSchema = z.object({
  date: z.iso.date(),
  items: z.array(z.object({
    movementItemId: identifier,
    receivedQuantity: z.number().nonnegative().max(1_000_000),
  })).min(1).optional(),
  receivedTotal: z.number().nonnegative().max(1_000_000).optional(),
  unit: z.enum(['bags', 'kg']).optional(),
});
const idempotencyKeySchema = z.string().trim().min(16).max(200);

const correctionSchema = z.object({
  originalMovementId: identifier,
  locationId: identifier,
  fromLotCode: identifier.max(40),
  toLotCode: identifier.max(40),
  quantity: z.number().positive().max(1_000_000),
  unit: z.enum(['bags', 'kg']),
});

const stockCountSchema = z.object({
  locationId: identifier.optional(),
  location: z.string().trim().min(1).max(120).optional(),
  lotId: identifier.optional(),
  lotCode: z.string().trim().min(1).max(40).optional(),
  observedQuantity: z.number().nonnegative().max(1_000_000),
  unit: z.enum(['bags', 'kg']),
  date: z.iso.date(),
  notes: optionalText(500),
});

const stockVerificationSchema = z.object({
  stockRecordId: identifier,
  expectedVersion: z.number().int().nonnegative(),
  countedQuantity: z.number().nonnegative().max(1_000_000),
  date: z.iso.date(),
  bags: z.number().positive().max(100_000).optional(),
  notes: optionalText(500),
});

const stockIntakeSchema = z.object({
  lotCode: z.string().trim().min(1).max(40),
  variety: z.string().trim().min(1).max(80),
  quantityKg: z.number().positive().max(1_000_000),
  date: z.iso.date(),
  destination: z.string().trim().min(1).max(120),
  origin: optionalText(120),
  remito: optionalText(40),
  bags: z.number().positive().max(100_000).optional(),
  averageKg: z.number().positive().max(200).optional(),
  caliber: optionalText(80),
  category: optionalText(80),
  bagColor: optionalText(40),
  threadColor: optionalText(40),
  transporter: optionalText(120),
  client: optionalText(120),
  dtv: optionalText(80),
  notes: optionalText(500),
  campaign: optionalText(20),
  producer: optionalText(120),
});

const traceabilityIntentInputSchema = z.object({
  text: z.string().trim().min(8).max(1000),
  lotId: identifier,
});

const exportRequirementsInputSchema = z.object({
  country: z.string().trim().min(2).max(80),
  documentType: z.string().trim().min(2).max(40),
  sourceText: z.string().trim().min(8).max(2000),
});

const operationsQuestionSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

export interface AppDependencies {
  repository?: Pick<PapaStockRepository,
    'loadSnapshot' | 'loadLot' | 'insertTraceabilityEvent' | 'previewStockTransfer' | 'executeStockTransfer' | 'executePlanillaImport' | 'executeStockVerification' | 'executeReception' | 'executeLotCorrection' | 'executeStockCount'>;
  analyze?: ReturnType<typeof createDiscrepancyAnalyzer>;
  parseMovementIntent?: ReturnType<typeof createMovementIntentParser>;
  parseTraceabilityIntent?: ReturnType<typeof createTraceabilityIntentParser>;
  parseExportRequirements?: ReturnType<typeof createExportRequirementsParser>;
  answerOperationsQuestion?: ReturnType<typeof createAiOperationsAssistant>;
  auth?: AuthService;
  checkReadiness?: () => Promise<void>;
  planillaUploadsEnabled?: boolean;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const auth = dependencies.auth ?? new AuthService({
    username: config.authUsername ?? '',
    passwordHash: config.authPasswordHash ?? '',
    sessionSecret: config.sessionSecret ?? '',
    secureCookies: config.nodeEnv === 'production',
  });
  const repository = dependencies.repository ?? (pool ? new PapaStockRepository(pool) : undefined);
  const checkReadiness = dependencies.checkReadiness ?? verifyDatabaseReadiness;
  const planillaUploadsEnabled = dependencies.planillaUploadsEnabled ?? config.nodeEnv !== 'production';
  const analyze = dependencies.analyze ?? createDiscrepancyAnalyzer({
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs,
  });
  const parseMovementIntent = dependencies.parseMovementIntent ?? createMovementIntentParser({
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs,
  });
  const groqOptions = {
    apiKey: config.groqApiKey,
    model: config.aiModel,
    timeoutMs: config.groqTimeoutMs,
  };
  const parseTraceabilityIntent = dependencies.parseTraceabilityIntent
    ?? createTraceabilityIntentParser(groqOptions);
  const parseExportRequirements = dependencies.parseExportRequirements
    ?? createExportRequirementsParser(groqOptions);
  const answerOperationsQuestion = dependencies.answerOperationsQuestion
    ?? createAiOperationsAssistant(groqOptions);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/ready', async (_request, response) => {
    try {
      await checkReadiness();
      return response.json({ status: 'ready' });
    } catch {
      return response.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/api', requireSameOrigin);
  app.post('/api/auth/login', (request, response, next) => {
    try {
      const credentials = loginSchema.parse(request.body);
      const identity = auth.authenticate(credentials.username, credentials.password);
      if (!identity) return response.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      const session = auth.createSession(identity);
      auth.setSessionCookie(response, session.token);
      return response.json({ data: identity });
    } catch (error) { return next(error); }
  });
  app.get('/api/auth/session', (request, response) => {
    const identity = auth.readSession(auth.tokenFrom(request));
    if (!identity) return response.status(401).json({ error: 'Autenticación requerida.' });
    return response.json({ data: identity });
  });
  app.post('/api/auth/logout', (request, response) => {
    auth.revokeSession(auth.tokenFrom(request));
    auth.clearSessionCookie(response);
    return response.status(204).end();
  });

  app.use('/api', requireAuthentication(auth));
  const canRead = requirePermission('data:read');
  const canWriteStock = requirePermission('stock:write');
  const canImport = requirePermission('imports:write');
  const canUseAi = requirePermission('ai:use');

  app.get('/api/snapshot', canRead, async (_request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.json({ data: await repository.loadSnapshot(), source: 'database' });
    } catch (error) { next(error); }
  });

  app.get('/api/lots/:id', canRead, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.json({ data: await repository.loadLot(identifier.parse(request.params.id)), source: 'database' });
    } catch (error) { next(error); }
  });

  app.post('/api/traceability', canWriteStock, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const event = traceabilityInputSchema.parse(request.body);
      response.status(201).json({ data: await repository.insertTraceabilityEvent(event) });
    } catch (error) { next(error); }
  });

  app.post('/api/ai/discrepancy', canUseAi, async (request, response, next) => {
    try {
      const input = discrepancyInputSchema.parse(request.body);
      response.json({ data: await analyze(input) });
    } catch (error) { next(error); }
  });

  app.post('/api/ai/movement-intent', canUseAi, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const { text } = movementTextSchema.parse(request.body);
      const snapshot = await repository.loadSnapshot();
      const data = await parseMovementIntent(text, {
        lots: snapshot.lots.map(({ code }) => ({ code })),
        locations: snapshot.locations.map(({ name }) => ({ name })),
      });
      response.json({ data });
    } catch (error) { next(error); }
  });

  app.post('/api/ai/traceability-intent', canUseAi, async (request, response, next) => {
    try {
      const { text } = traceabilityIntentInputSchema.parse(request.body);
      response.json({ data: await parseTraceabilityIntent(text) });
    } catch (error) { next(error); }
  });

  app.post('/api/ai/export-requirements', canUseAi, async (request, response, next) => {
    try {
      const input = exportRequirementsInputSchema.parse(request.body);
      response.json({ data: await parseExportRequirements(input) });
    } catch (error) { next(error); }
  });

  app.post('/api/ai/operations', canUseAi, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const { question } = operationsQuestionSchema.parse(request.body);
      const context = buildAiOperationsContext(await repository.loadSnapshot());
      response.json({ data: await answerOperationsQuestion(question, context) });
    } catch (error) { next(error); }
  });

  app.post('/api/movements/preview', canWriteStock, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.json({ data: await repository.previewStockTransfer(movementIntentSchema.parse(request.body)) });
    } catch (error) { next(error); }
  });

  app.post('/api/movements', canWriteStock, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const movement = await repository.executeStockTransfer(movementIntentSchema.parse(request.body));
      response.status(201).json({ data: movement });
    } catch (error) { next(error); }
  });

  app.post('/api/movements/:id/reception', canWriteStock, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const body = receptionSchema.parse(request.body);
      response.status(201).json({
        data: await repository.executeReception({
          movementId: identifier.parse(request.params.id),
          idempotencyKey: idempotencyKeySchema.parse(request.get('Idempotency-Key')),
          date: body.date,
          items: body.items,
          receivedTotal: body.receivedTotal,
          unit: body.unit,
        }),
      });
    } catch (error) { next(error); }
  });

  app.post('/api/movements/corrections', canWriteStock, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.status(201).json({ data: await repository.executeLotCorrection(correctionSchema.parse(request.body)) });
    } catch (error) { next(error); }
  });

  app.post('/api/stock-counts', canWriteStock, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      response.status(201).json({ data: await repository.executeStockCount(stockCountSchema.parse(request.body)) });
    } catch (error) { next(error); }
  });

  const excelBody = express.raw({ type: () => true, limit: PLANILLA_LIMITS.maxFileBytes });
  const requirePlanillaUploads = (_request: Request, response: Response, next: NextFunction) => {
    if (!planillaUploadsEnabled) {
      return response.status(503).json({ error: 'La importación de planillas está temporalmente deshabilitada.' });
    }
    return next();
  };

  function readWorkbookUpload(request: Request): { buffer: Buffer; fileName: string } {
    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw Object.assign(new Error('Adjuntá un archivo .csv, .xls o .xlsx.'), { status: 400 });
    }
    const headerName = request.header('x-filename');
    let fileName: string;
    try {
      fileName = headerName ? decodeURIComponent(headerName).trim() : '';
    } catch {
      throw Object.assign(new Error('El nombre del archivo no es válido.'), { status: 400 });
    }
    if (!fileName) throw Object.assign(new Error('Falta el nombre del archivo.'), { status: 400 });
    validatePlanillaUpload(body, fileName, request.header('content-type'));
    return { buffer: body, fileName };
  }

  app.post('/api/imports/planilla/preview', canImport, requirePlanillaUploads, excelBody, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const { buffer, fileName } = readWorkbookUpload(request);
      const snapshot = await repository.loadSnapshot();
      const plan = buildPlanillaImportFromFile(buffer, fileName, snapshot);
      response.json({ data: plan.preview });
    } catch (error) { next(error); }
  });

  app.post('/api/imports/planilla', canImport, requirePlanillaUploads, excelBody, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const { buffer, fileName } = readWorkbookUpload(request);
      const snapshot = await repository.loadSnapshot();
      const plan = buildPlanillaImportFromFile(buffer, fileName, snapshot);
      const materialized = materializePlanillaImport(plan, snapshot);
      const persisted = await repository.executePlanillaImport(plan);
      response.status(201).json({
        data: {
          ...persisted,
          persisted: true,
          applied: {
            locations: materialized.applied.locations,
            lots: materialized.applied.lots,
            stockRecords: materialized.applied.stockRecords,
            movements: materialized.applied.movements,
          },
        },
      });
    } catch (error) { next(error); }
  });

  async function snapshotForImport() {
    if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
    return repository.loadSnapshot();
  }

  app.post('/api/stock/intake/preview', canImport, async (request, response, next) => {
    try {
      const input = stockIntakeSchema.parse(request.body);
      const plan = buildStockIntakePlan(input, await snapshotForImport());
      response.json({ data: plan.preview });
    } catch (error) { next(error); }
  });

  app.post('/api/stock/intake', canImport, async (request, response, next) => {
    try {
      if (!repository) throw Object.assign(new Error('Base de datos no configurada.'), { status: 503 });
      const input = stockIntakeSchema.parse(request.body);
      const snapshot = await snapshotForImport();
      const plan = buildStockIntakePlan(input, snapshot);
      if (!plan.preview.valid) {
        throw Object.assign(new Error(plan.preview.issues[0]?.message ?? 'La carga de stock no es válida.'), { status: 400, details: plan.preview.issues });
      }
      const materialized = materializePlanillaImport(plan, snapshot);
      const persisted = await repository.executePlanillaImport(plan);
      response.status(201).json({
        data: {
          ...persisted,
          persisted: true,
          applied: {
            locations: materialized.applied.locations,
            lots: materialized.applied.lots,
            stockRecords: materialized.applied.stockRecords,
            movements: materialized.applied.movements,
          },
        },
      });
    } catch (error) { next(error); }
  });

  app.post('/api/stock/verify', canWriteStock, async (request, response, next) => {
    try {
      const input = stockVerificationSchema.parse(request.body);
      const snapshot = await snapshotForImport();
      const preview = buildStockVerificationPreview(
        input,
        getStockViews(snapshot.stockRecords, snapshot.lots, snapshot.locations),
      );
      if (!preview.valid) {
        throw Object.assign(new Error(preview.issues[0]?.message ?? 'La verificación no es válida.'), { status: 400, details: preview.issues });
      }
      if (repository?.executeStockVerification) {
        response.status(201).json({ data: await repository.executeStockVerification(input) });
        return;
      }
      response.status(201).json({ data: toStockVerificationConfirmation(preview, false) });
    } catch (error) { next(error); }
  });

  app.use('/api', (_request, response) => response.status(404).json({ error: 'Endpoint no encontrado.' }));
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) return response.status(400).json({ error: 'Solicitud inválida.', details: z.treeifyError(error) });
    const candidate = error as { status?: number; code?: string; message?: string; details?: unknown };
    const status = candidate.status ?? (candidate.code === '23505' ? 409 : 500);
    if (status >= 500) console.error('[api]', error);
    const retryAfterSeconds = status === 429 && candidate.details && typeof candidate.details === 'object'
      ? (candidate.details as { retryAfterSeconds?: unknown }).retryAfterSeconds
      : undefined;
    if (typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
      response.set('retry-after', String(Math.ceil(retryAfterSeconds)));
    }
    return response.status(status).json({
      error: status >= 500 ? 'No se pudo completar la operación.' : candidate.message,
      ...(candidate.details ? { details: candidate.details } : {}),
    });
  });
  return app;
}
