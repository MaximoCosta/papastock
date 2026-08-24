import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { runMigrations } from '../db/migrationRunner';
import { applyShowcaseDataset } from '../db/showcaseDataset';
import { PapaStockRepository } from '../repositories/papaStockRepository';
import { buildAiOperationsContext, createAiOperationsAssistant, measureAiOperationsContext } from './aiOperationsAssistant';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('asistente operativo con PostgreSQL 18 real', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    assertDisposableDatabase(testDatabaseUrl!);
    pool = new pg.Pool({ connectionString: testDatabaseUrl, max: 4 });
    await pool.query('drop schema if exists public cascade');
    await pool.query('create schema public');
    const client = await pool.connect();
    try {
      const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');
      await runMigrations(client, migrationsDirectory, { to: '006_stock_record_version.sql' });
    } finally {
      client.release();
    }
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('construye contexto Showcase sin 007/008 y conserva autoridad global false', async () => {
    const client = await pool.connect();
    const result = await applyShowcaseDataset(client).finally(() => client.release());
    expect(result.created).toBe(true);

    const snapshot = await new PapaStockRepository(pool).loadSnapshot();
    const context = buildAiOperationsContext(snapshot, '2026-08-24T12:00:00.000Z');

    expect(context.lots.filter((row) => row.code.startsWith('SHOW-')).map((row) => row.code)).toEqual([
      'SHOW-001',
      'SHOW-002',
      'SHOW-003',
    ]);
    expect(context.stockRecords.find((row) => row.id === 'stock-showcase-001-oriente-kg')).toMatchObject({
      declaredQuantity: 8_000,
      verifiedQuantity: 7_900,
      verificationPending: false,
    });
    expect(context.stockRecords.find((row) => row.id === 'stock-showcase-001-frig-a-kg')).toMatchObject({
      declaredQuantity: 2_250,
      verifiedQuantity: 2_250,
    });
    expect(context.stockRecords.find((row) => row.id === 'stock-showcase-002-oriente-kg')).toMatchObject({
      declaredQuantity: 5_000,
    });
    expect(context.stockRecords.find((row) => row.id === 'stock-showcase-002-frig-a-kg')).toMatchObject({
      declaredQuantity: 750,
    });
    expect(context.stockRecords.find((row) => row.id === 'stock-showcase-003-oriente-kg')).toMatchObject({
      verificationPending: true,
    });
    expect(context.movements.find((row) => row.id === 'movement-showcase-transfer-002')).toMatchObject({
      status: 'pending',
      receptionStatus: 'pending',
    });
    expect(context.ledger.classifications.filter((row) => row.lotCode.startsWith('SHOW-'))).toHaveLength(5);
    expect(context.ledger.classifications.filter((row) => row.lotCode.startsWith('SHOW-')).every((row) => row.classification === 'MATCH')).toBe(true);
    expect(context.ledger.ledgerAuthority).toBe(false);
    expect(measureAiOperationsContext(context)).toMatchObject({
      counts: {
        lots: 5,
        stockRecords: 7,
        movements: 7,
        movementItems: 8,
        traceability: 3,
        discrepancies: 0,
        stockCounts: 0,
      },
    });
    expect(measureAiOperationsContext(context).jsonBytes).toBeLessThan(50_000);
  }, 30_000);

  it('proyecta los seis intents sobre 001-008 sin escribir stock', async () => {
    await pool.query('drop schema if exists public cascade');
    await pool.query('create schema public');
    const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');
    const migrationClient = await pool.connect();
    try {
      await runMigrations(migrationClient, migrationsDirectory, { to: '007_opening_balance.sql' });
      const seedSql = await readFile(path.join(migrationsDirectory, 'seed.sql'), 'utf8');
      await migrationClient.query('begin');
      await migrationClient.query(seedSql);
      await migrationClient.query('commit');
      await applyShowcaseDataset(migrationClient);
      await runMigrations(migrationClient, migrationsDirectory, { only: '008_approved_opening_balances.sql' });
      for (const fixture of [
        { suffix: 'a310', lotId: 'lot-a310', quantity: 1_000 },
        { suffix: 'b118', lotId: 'lot-b118', quantity: 100 },
      ]) {
        const movementId = `movement-ai-context-${fixture.suffix}`;
        await migrationClient.query(
          `insert into public.movements
            (id, reference, origin_location_id, destination_location_id, movement_date, status, kind, reception_status, data)
           values ($1, $2, null, $3, $4, 'completed', 'import', 'not_applicable', $5::jsonb)`,
          [movementId, `AI-CONTEXT-${fixture.suffix.toUpperCase()}`, 'loc-warehouse', '2026-08-24', JSON.stringify({ source: 'ai_context_test' })],
        );
        await migrationClient.query(
          `insert into public.movement_items
            (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
           values ($1, $2, $3, $4, 'kg', 0, $5::jsonb)`,
          [`item-ai-context-${fixture.suffix}`, movementId, fixture.lotId, fixture.quantity, JSON.stringify({ source: 'ai_context_test' })],
        );
        await migrationClient.query(
          `insert into public.stock_records
            (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit)
           values ($1, $2, $3, $4, $4, false, $5, 'kg')`,
          [`stock-ai-context-${fixture.suffix}`, fixture.lotId, 'loc-warehouse', fixture.quantity, '2026-08-24T12:00:00.000Z'],
        );
      }
    } finally {
      migrationClient.release();
    }

    const stockFingerprint = async () => (await pool.query<{ fingerprint: string }>(`
      select md5(string_agg(concat_ws('|', id, lot_id, location_id, unit, declared_quantity,
        verified_quantity, verification_pending, version), E'\\n' order by id)) as fingerprint
      from public.stock_records
    `)).rows[0].fingerprint;
    const beforeFingerprint = await stockFingerprint();
    const snapshot = await new PapaStockRepository(pool).loadSnapshot();
    const questions = [
      '¿Cuánto stock hay de SHOW-001?',
      '¿Dónde está SHOW-002?',
      '¿Qué lotes tienen verificación pendiente?',
      '¿Qué movimientos están pendientes de recepción?',
      '¿El ledger es completamente autoritativo?',
      '¿Qué pasó con SHOW-001?',
    ];
    const expected = [
      { intent: 'LOT_STOCK', lots: 1, stockRecords: 2, movements: 0 },
      { intent: 'LOT_LOCATION', lots: 1, stockRecords: 2, movements: 0 },
      { intent: 'PENDING_VERIFICATION', lots: 2, stockRecords: 2, movements: 0 },
      { intent: 'PENDING_RECEPTION', lots: 1, stockRecords: 0, movements: 1 },
      { intent: 'LEDGER_AUTHORITY', lots: 0, stockRecords: 0, movements: 0 },
      { intent: 'LOT_HISTORY', lots: 1, stockRecords: 2, movements: 3 },
    ];
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      for (const [index, question] of questions.entries()) {
        const context = buildAiOperationsContext(question, snapshot, '2026-08-24T12:00:00.000Z');
        const metrics = measureAiOperationsContext(context);
        expect(context.ledger).toMatchObject({ ledgerAuthority: true, blockingIssues: 0 });
        expect(context.ledger.classificationCounts).toMatchObject({
          MATCH: 19,
          MISSING_LEDGER_BALANCE: 0,
          INVALID_NEGATIVE_BALANCE: 0,
        });
        expect({ intent: context.intent, ...metrics.counts }).toMatchObject(expected[index]);
        let requestBodyBytes = 0;
        const fetchImpl = (async (_url, init) => {
          requestBodyBytes = Buffer.byteLength(String(init?.body ?? ''), 'utf8');
          return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
            answer: 'Respuesta canónica.', confidence: 'high', dataQuality: 'authoritative',
            entities: [], warnings: [], evidence: [{ source: 'ledger', description: 'Resumen canónico.' }],
          }) } }] }), { status: 200 });
        }) as typeof fetch;
        await createAiOperationsAssistant({
          apiKey: 'fixture', model: 'openai/gpt-oss-20b', timeoutMs: 100,
          maxRequestBodyBytes: 20_000, fetchImpl,
        })(question, context);
        expect(requestBodyBytes).toBeLessThan(7_000);
      }
    } finally {
      info.mockRestore();
    }
    expect(await stockFingerprint()).toBe(beforeFingerprint);
  }, 30_000);
});
