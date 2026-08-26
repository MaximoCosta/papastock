import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadLedgerVerifierInput, verifyLedgerWithClient } from '../db/ledgerAudit';
import { materializeLegacyMovementItemsInTestDatabase } from '../db/legacyMovementItems';
import { runMigrations } from '../db/migrationRunner';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('ledger verifier con PostgreSQL real', () => {
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

  beforeEach(async () => {
    await pool.query(`
      truncate table
        public.stock_counts,
        public.discrepancies,
        public.traceability_events,
        public.movement_items,
        public.movements,
        public.stock_records,
        public.lots,
        public.locations
      cascade
    `);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('crea una base nueva con seed sin movimientos legacy y genera el manifiesto esperado', async () => {
    const seedSql = await readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations/seed.sql'), 'utf8');
    await pool.query(seedSql);
    await pool.query(seedSql);

    const missing = await pool.query(`
      select m.id
      from public.movements m
      where not exists (select 1 from public.movement_items mi where mi.movement_id = m.id)
    `);
    const duplicateItems = await pool.query(`
      select movement_id
      from public.movement_items
      group by movement_id
      having count(*) > 1
    `);
    expect(missing.rows).toEqual([]);
    expect(duplicateItems.rows).toEqual([]);

    const client = await pool.connect();
    try {
      const result = await verifyLedgerWithClient(client);
      const coordinate = (lotCode: string, locationId: string, unit: string) => result.coordinates.find(
        (row) => row.lotCode === lotCode && row.locationId === locationId && row.unit === unit,
      );
      expect(coordinate('A-204', 'loc-south', 'kg')).toMatchObject({
        persistedBalance: 25000, ledgerBalance: 9000, candidateOpeningBalance: 16000,
        classification: 'MISSING_LEDGER_BALANCE', verifiedQuantity: 24000,
      });
      expect(coordinate('A-310', 'loc-central', 'kg')).toMatchObject({
        persistedBalance: 22000, ledgerBalance: 22000, candidateOpeningBalance: 0, classification: 'MATCH',
      });
      expect(coordinate('A-310', 'loc-warehouse', 'kg')).toMatchObject({
        persistedBalance: 0, ledgerBalance: -22000, classification: 'INVALID_NEGATIVE_BALANCE',
      });
      expect(coordinate('B-221', 'loc-south', 'kg')).toMatchObject({ candidateOpeningBalance: 15200, classification: 'MISSING_LEDGER_BALANCE' });
      expect(coordinate('300', 'loc-oriente', 'bags')).toMatchObject({ candidateOpeningBalance: 500, classification: 'MISSING_LEDGER_BALANCE' });
      expect(coordinate('301', 'loc-oriente', 'bags')).toMatchObject({ candidateOpeningBalance: 300, classification: 'MISSING_LEDGER_BALANCE' });
      expect(result.blockingIssues).toEqual([]);
      expect(result.ledgerAuthority).toBe(false);
    } finally {
      client.release();
    }
  });

  it('reconstruye transfer/import/cancelled y correction restore/deduct', async () => {
    await pool.query(`
      insert into public.locations (id, name, type) values
        ('origin', 'Origen', 'warehouse'), ('destination', 'Destino', 'cold_storage');
      insert into public.lots (id, code, variety, campaign, producer, origin) values
        ('lot-a', 'A', 'Spunta', '2025/26', 'Papasud', 'Balcarce'),
        ('lot-b', 'B', 'Spunta', '2025/26', 'Papasud', 'Balcarce');

      insert into public.movements
        (id, reference, origin_location_id, destination_location_id, quantity, movement_date, status, kind, reception_status)
      values
        ('transfer', 'MV-T', 'origin', 'destination', 10, current_date, 'completed', 'transfer', 'pending'),
        ('import', 'MV-I', null, 'destination', 4, current_date, 'completed', 'import', 'not_applicable'),
        ('cancelled', 'MV-X', 'origin', 'destination', 99, current_date, 'cancelled', 'transfer', 'not_applicable');
      insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order) values
        ('item-t', 'transfer', 'lot-a', 10, 'kg', 0),
        ('item-i', 'import', 'lot-a', 4, 'kg', 0),
        ('item-x', 'cancelled', 'lot-a', 99, 'kg', 0);

      insert into public.movements
        (id, reference, origin_location_id, destination_location_id, quantity, movement_date, status, kind, corrects_movement_id, reception_status)
      values ('correction', 'MV-C', 'destination', 'destination', 2, current_date, 'completed', 'correction', 'transfer', 'not_applicable');
      insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data) values
        ('restore', 'correction', 'lot-b', 2, 'kg', 0, '{"effect":"restore"}'),
        ('deduct', 'correction', 'lot-a', 2, 'kg', 1, '{"effect":"deduct"}');
    `);

    const client = await pool.connect();
    try {
      const result = await verifyLedgerWithClient(client);
      expect(result.coordinates.find((row) => row.lotCode === 'A' && row.locationId === 'destination')?.ledgerBalance).toBe(12);
      expect(result.coordinates.find((row) => row.lotCode === 'B' && row.locationId === 'destination')?.ledgerBalance).toBe(2);
      expect(result.coordinates.find((row) => row.lotCode === 'A' && row.locationId === 'origin')?.ledgerBalance).toBe(-10);
      expect(result.blockingIssues).toEqual([]);
    } finally {
      client.release();
    }
  });

  it('materializa sólo legacy inequívocos, es idempotente y bloquea unidad ambigua', async () => {
    await pool.query(`
      insert into public.locations (id, name, type) values
        ('origin', 'Origen', 'warehouse'), ('destination', 'Destino', 'cold_storage');
      insert into public.lots (id, code, variety, campaign, producer, origin) values
        ('lot-safe', 'SAFE', 'Spunta', '2025/26', 'Papasud', 'Balcarce'),
        ('lot-mixed', 'MIXED', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-safe', 'lot-safe', 'destination', 10, 10, false, 'kg'),
        ('stock-mixed-kg', 'lot-mixed', 'destination', 10, 10, false, 'kg'),
        ('stock-mixed-bags', 'lot-mixed', 'destination', 2, 2, false, 'bags');
      insert into public.movements
        (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, kind, reception_status)
      values
        ('legacy-safe', 'MV-SAFE', 'lot-safe', 'origin', 'destination', 10, current_date, 'completed', 'transfer', 'not_applicable'),
        ('legacy-mixed', 'MV-MIXED', 'lot-mixed', 'origin', 'destination', 10, current_date, 'completed', 'transfer', 'not_applicable');
    `);

    const client = await pool.connect();
    try {
      const first = await materializeLegacyMovementItemsInTestDatabase(client);
      const second = await materializeLegacyMovementItemsInTestDatabase(client);
      expect(first.inserted).toBe(1);
      expect(first.blocked).toEqual([{ movementId: 'legacy-mixed', reference: 'MV-MIXED', reason: 'unidad no inferible con certeza' }]);
      expect(second.inserted).toBe(0);
      const items = await client.query('select movement_id, unit from public.movement_items order by movement_id');
      expect(items.rows).toEqual([{ movement_id: 'legacy-safe', unit: 'kg' }]);
      const audit = await verifyLedgerWithClient(client);
      expect(audit.blockingIssues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
        'MOVEMENT_WITHOUT_ITEMS', 'LEGACY_MOVEMENT_WITHOUT_ITEMS',
      ]));
      expect(audit.ledgerAuthority).toBe(false);
      expect((await loadLedgerVerifierInput(client)).movementItems).toHaveLength(1);
    } finally {
      client.release();
    }
  });
});
