import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PapaStockRepository } from '../repositories/papaStockRepository';
import { runMigrations } from './migrationRunner';
import { applyShowcaseDataset, showcaseManifest } from './showcaseDataset';
import { buildAiOperationsContext } from '../services/aiOperationsAssistant';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('Showcase con PostgreSQL real', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    assertDisposableDatabase(testDatabaseUrl!);
    pool = new pg.Pool({ connectionString: testDatabaseUrl, max: 4 });
    await pool.query('drop schema if exists public cascade');
    await pool.query('create schema public');
    const client = await pool.connect();
    try {
      const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');
      await runMigrations(client, migrationsDirectory, { to: '007_opening_balance.sql' });
    } finally {
      client.release();
    }
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('aplica una vez, reejecuta sin cambios, aparece en snapshot y queda MATCH', async () => {
    const firstClient = await pool.connect();
    const first = await applyShowcaseDataset(firstClient).finally(() => firstClient.release());
    expect(first.created).toBe(true);
    expect(first.showcaseCoordinates).toHaveLength(5);
    expect(first.showcaseCoordinates.every((row) => row.classification === 'MATCH')).toBe(true);

    const secondClient = await pool.connect();
    const second = await applyShowcaseDataset(secondClient).finally(() => secondClient.release());
    expect(second.created).toBe(false);
    expect(second.showcaseCoordinates).toEqual(first.showcaseCoordinates);

    const counts = await pool.query<{ lots: number; movements: number; items: number; stock: number; traces: number }>(`
      select
        (select count(*)::int from public.lots where id = any($1::text[])) as lots,
        (select count(*)::int from public.movements where data->>'source' = $2) as movements,
        (select count(*)::int from public.movement_items where data->>'source' = $2) as items,
        (select count(*)::int from public.stock_records where lot_id = any($1::text[])) as stock,
        (select count(*)::int from public.traceability_events where data->>'source' = $2) as traces
    `, [showcaseManifest.lots.map((row) => row.id), showcaseManifest.source]);
    expect(counts.rows[0]).toEqual({ lots: 3, movements: 7, items: 8, stock: 5, traces: 3 });

    const invariants = await pool.query<{
      invalid_corrections: number; invalid_receptions: number; duplicate_reception_keys: number; invalid_versions: number;
    }>(`
      select
        (select count(*)::int from public.movements where data->>'source' = $1 and kind = 'correction'
          and (corrects_movement_id is null or origin_location_id is null or destination_location_id <> origin_location_id)) as invalid_corrections,
        (select count(*)::int from public.movements where data->>'source' = $1 and reception_idempotency_key is not null
          and (reception_status <> 'received' or reception_payload_fingerprint !~ '^[0-9a-f]{64}$')) as invalid_receptions,
        (select count(*)::int from (select reception_idempotency_key from public.movements where reception_idempotency_key is not null group by reception_idempotency_key having count(*) > 1) duplicates) as duplicate_reception_keys,
        (select count(*)::int from public.stock_records where lot_id = any($2::text[]) and version < 0) as invalid_versions
    `, [showcaseManifest.source, showcaseManifest.lots.map((row) => row.id)]);
    expect(invariants.rows[0]).toEqual({ invalid_corrections: 0, invalid_receptions: 0, duplicate_reception_keys: 0, invalid_versions: 0 });

    const snapshot = await new PapaStockRepository(pool).loadSnapshot();
    expect(snapshot.lots.filter((row) => row.code.startsWith('SHOW-')).map((row) => row.code)).toEqual(['SHOW-001', 'SHOW-002', 'SHOW-003']);
    expect(snapshot.movements.filter((row) => row.data?.source === showcaseManifest.source)).toHaveLength(7);
    expect(snapshot.stockRecords.filter((row) => row.lotId.startsWith('lot-showcase-'))).toHaveLength(5);

    const aiContext = buildAiOperationsContext(snapshot, '2026-08-24T12:00:00.000Z');
    expect(aiContext.stockRecords.find((row) => row.id === 'stock-showcase-001-oriente-kg')).toMatchObject({
      declaredQuantity: 8000, verifiedQuantity: 7900, verificationPending: false,
    });
    expect(aiContext.movements.find((row) => row.id === 'movement-showcase-transfer-002')).toMatchObject({
      receptionStatus: 'pending', status: 'pending',
    });
    expect(aiContext.stockRecords.find((row) => row.id === 'stock-showcase-003-oriente-kg')).toMatchObject({
      verificationPending: true,
    });
    expect(aiContext.ledger.ledgerAuthority).toBe(false);
    expect(aiContext.ledger.classifications.filter((row) => row.lotCode.startsWith('SHOW-')).every((row) => row.classification === 'MATCH')).toBe(true);

    await pool.query("update public.stock_records set declared_quantity = declared_quantity + 1 where id = 'stock-showcase-001-oriente-kg'");
    const driftClient = await pool.connect();
    await expect(applyShowcaseDataset(driftClient).finally(() => driftClient.release())).rejects.toThrow('Drift detectado en stock_records');
    const drift = await pool.query<{ quantity: string }>("select declared_quantity::text as quantity from public.stock_records where id = 'stock-showcase-001-oriente-kg'");
    expect(drift.rows[0].quantity).toBe('8001.000');
  }, 30_000);
});
