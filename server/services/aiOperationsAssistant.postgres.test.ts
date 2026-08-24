import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrationRunner';
import { applyShowcaseDataset } from '../db/showcaseDataset';
import { PapaStockRepository } from '../repositories/papaStockRepository';
import { buildAiOperationsContext } from './aiOperationsAssistant';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('asistente operativo con PostgreSQL real 001-006', () => {
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
  }, 30_000);
});
