import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrationRunner';
import { applyShowcaseDataset } from '../db/showcaseDataset';
import { verifyLedgerWithClient } from '../db/ledgerAudit';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDirectory = path.join(root, 'migrations');
const manifestPath = path.join(migrationsDirectory, '008_approved_opening_balances.sql');

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('H4-B opening balances aprobados con PostgreSQL 18', () => {
  let pool: pg.Pool;
  let manifestSql: string;

  async function applyManifest(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(manifestSql);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async function audit() {
    const client = await pool.connect();
    try {
      return await verifyLedgerWithClient(client);
    } finally {
      client.release();
    }
  }

  async function stockFingerprint() {
    const rows = (await pool.query('select * from public.stock_records order by id')).rows;
    return {
      count: rows.length,
      hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
    };
  }

  beforeEach(async () => {
    assertDisposableDatabase(testDatabaseUrl!);
    pool ??= new pg.Pool({ connectionString: testDatabaseUrl, max: 4 });
    manifestSql ??= await readFile(manifestPath, 'utf8');
    await pool.query('drop schema if exists public cascade');
    await pool.query('create schema public');
    const client = await pool.connect();
    try {
      await runMigrations(client, migrationsDirectory, { to: '007_opening_balance.sql' });
    } finally {
      client.release();
    }
    await pool.query(await readFile(path.join(migrationsDirectory, 'seed.sql'), 'utf8'));
    await pool.query(`
      update public.stock_records
      set declared_quantity = 21000, verified_quantity = 21000
      where lot_id = 'lot-a310' and location_id = 'loc-central' and unit = 'kg';
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-a310-warehouse-current', 'lot-a310', 'loc-warehouse', 1000, 1000, false, 'kg');

      update public.stock_records
      set declared_quantity = 14400, verified_quantity = 14400
      where lot_id = 'lot-b118' and location_id = 'loc-north' and unit = 'kg';
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-c593873b-4378-4aac-89a1-768b7677ea30', 'lot-b118', 'loc-warehouse', 100, 100, false, 'kg');

      insert into public.movements
        (id, reference, origin_location_id, destination_location_id, quantity,
         movement_date, status, kind, reception_status)
      values
        ('movement-prod-a310-current', 'MV-PROD-A310-CURRENT', 'loc-central', 'loc-warehouse',
         1000, date '2026-08-22', 'completed', 'transfer', 'not_applicable'),
        ('movement-prod-b118-n01', 'MV-N01-DA6EA5DC', 'loc-north', 'loc-warehouse',
         100, date '2026-08-22', 'completed', 'transfer', 'pending');
      insert into public.movement_items
        (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
      values
        ('item-prod-a310-current', 'movement-prod-a310-current', 'lot-a310', 1000, 'kg', 0),
        ('item-prod-b118-n01', 'movement-prod-b118-n01', 'lot-b118', 100, 'kg', 0);
    `);
    const showcaseClient = await pool.connect();
    try {
      await applyShowcaseDataset(showcaseClient);
    } finally {
      showcaseClient.release();
    }
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('crea 14, conserva stock, documenta 21→19 net-zero y es idempotente', async () => {
    const beforeStock = await stockFingerprint();
    const before = await audit();
    expect(before.coordinates).toHaveLength(21);
    expect(before.classificationCounts).toMatchObject({
      MATCH: 7,
      MISSING_LEDGER_BALANCE: 10,
      INVALID_NEGATIVE_BALANCE: 4,
    });
    for (const [locationId, ledgerBalance] of [['loc-north', -1000], ['loc-warehouse', -8000]] as const) {
      const coordinate = before.coordinates.find(
        (row) => row.lotCode === 'A-204' && row.locationId === locationId && row.unit === 'kg',
      );
      expect(coordinate).toMatchObject({ persistedBalance: 0, ledgerBalance });
      expect(coordinate?.verifiedQuantity).toBeUndefined();
    }

    await applyManifest();
    const firstStock = await stockFingerprint();
    const first = await audit();
    expect(firstStock).toEqual(beforeStock);
    expect(first.coordinates).toHaveLength(19);
    expect(first.classificationCounts).toEqual({
      MATCH: 19,
      MISSING_LEDGER_BALANCE: 0,
      LEDGER_EXCEEDS_STOCK: 0,
      STOCK_RECORD_MISSING: 0,
      UNIT_MISMATCH: 0,
      INVALID_NEGATIVE_BALANCE: 0,
    });
    expect(first.blockingIssues).toEqual([]);
    expect(first.ledgerAuthority).toBe(true);
    expect(first.coordinates.filter((row) => row.lotCode.startsWith('SHOW-'))).toHaveLength(5);
    expect(first.coordinates.filter((row) => row.lotCode.startsWith('SHOW-')).every(
      (row) => row.classification === 'MATCH',
    )).toBe(true);
    expect(first.coordinates.some((row) => row.lotCode === 'A-204' && (
      row.locationId === 'loc-north' || row.locationId === 'loc-warehouse'
    ))).toBe(false);
    expect(first.coordinates).toHaveLength(beforeStock.count);
    const stockCoordinates = (await pool.query(
      "select lot_id, location_id, unit from public.stock_records order by lot_id, location_id, unit",
    )).rows;
    expect(stockCoordinates.every((stock) => first.coordinates.some(
      (row) => row.lotId === stock.lot_id && row.locationId === stock.location_id && row.unit === stock.unit,
    ))).toBe(true);

    const nonZeroLedgerOnly = before.coordinates.filter((row) => row.verifiedQuantity === undefined);
    expect(nonZeroLedgerOnly.map((row) => [row.locationId, row.ledgerBalance])).toEqual([
      ['loc-north', -1000],
      ['loc-warehouse', -8000],
    ]);

    await applyManifest();
    expect(await stockFingerprint()).toEqual(beforeStock);
    expect((await pool.query("select count(*)::int as count from public.movements where kind = 'opening_balance'")).rows[0].count).toBe(14);
    expect((await pool.query("select count(*)::int as count from public.movement_items where data->>'manifest' = '008_approved_opening_balances'")).rows[0].count).toBe(14);
    expect((await audit()).ledgerAuthority).toBe(true);
  }, 30_000);

  it('nunca oculta una coordenada ledger-only con saldo distinto de cero', async () => {
    await pool.query(`
      insert into public.movements
        (id, reference, origin_location_id, destination_location_id, quantity,
         movement_date, status, kind, reception_status)
      values
        ('movement-ledger-only-nonzero', 'MV-LEDGER-ONLY-NONZERO',
         'loc-oriente', 'loc-south', 1, date '2026-08-24',
         'completed', 'transfer', 'not_applicable');
      insert into public.movement_items
        (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
      values
        ('item-ledger-only-nonzero', 'movement-ledger-only-nonzero', 'lot-300', 1, 'bags', 0);
    `);
    const result = await audit();
    expect(result.coordinates.find(
      (row) => row.lotCode === '300' && row.locationId === 'loc-south' && row.unit === 'bags',
    )).toMatchObject({
      persistedBalance: 0,
      ledgerBalance: 1,
      classification: 'STOCK_RECORD_MISSING',
    });
  });

  it('los 14 candidatos coinciden exactamente con el audit aprobado', async () => {
    await applyManifest();
    const rows = (await pool.query(`
      select movement.reference, lot.code as "lotCode", movement.destination_location_id as "locationId",
             item.unit, item.dispatched_quantity::float8 as quantity,
             (movement.data->>'candidateOpeningBalance')::float8 as candidate
      from public.movements movement
      join public.movement_items item on item.movement_id = movement.id
      join public.lots lot on lot.id = item.lot_id
      where movement.data->>'manifest' = '008_approved_opening_balances'
      order by movement.id
    `)).rows;
    expect(rows).toHaveLength(14);
    expect(rows.every((row) => row.quantity === row.candidate && row.quantity > 0)).toBe(true);
    expect(rows.some((row) => String(row.lotCode).startsWith('SHOW-'))).toBe(false);
  });

  it('aborta con sólo un movement existente', async () => {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(`
        insert into public.movements
          (id, reference, lot_id, destination_location_id, quantity, movement_date,
           status, kind, reception_status, data)
        values
          ('movement-opening-008-300-loc-oriente-bags', 'OPENING-300-LOC-ORIENTE-BAGS',
           'lot-300', 'loc-oriente', 500, date '2026-08-24', 'completed',
           'opening_balance', 'not_applicable', '{"source":"partial"}')
      `);
      await expect(client.query(manifestSql)).rejects.toThrow(/parcial o divergente/);
      await client.query('rollback');
    } finally {
      client.release();
    }
  });

  it('aborta con sólo un movement_item identificado', async () => {
    await pool.query(`
      insert into public.movement_items
        (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
      values
        ('item-opening-008-300-loc-oriente-bags', 'movement-prod-b118-n01',
         'lot-300', 500, 'bags', 0, '{"source":"collision"}')
    `);
    await expect(applyManifest()).rejects.toThrow(/parcial o divergente/);
  });

  it.each([
    ['reference incorrecta', "update public.movements set reference = 'OPENING-WRONG' where id = 'movement-opening-008-300-loc-oriente-bags'"],
    ['destination incorrecta', "update public.movements set destination_location_id = 'loc-south' where id = 'movement-opening-008-300-loc-oriente-bags'"],
    ['quantity incorrecta', "update public.movements set quantity = 501 where id = 'movement-opening-008-300-loc-oriente-bags'"],
    ['lot incorrecto', "update public.movements set lot_id = 'lot-301' where id = 'movement-opening-008-300-loc-oriente-bags'"],
    ['unit incorrecta', "update public.movement_items set unit = 'kg' where id = 'item-opening-008-300-loc-oriente-bags'"],
    ['metadata/source incorrecta', "update public.movements set data = jsonb_set(data, '{source}', '\"wrong\"') where id = 'movement-opening-008-300-loc-oriente-bags'"],
  ])('aborta con 14 IDs pero %s', async (_label, mutation) => {
    await applyManifest();
    await pool.query(mutation);
    await expect(applyManifest()).rejects.toThrow(/parcial o divergente/);
    expect((await pool.query("select count(*)::int as count from public.movements where kind = 'opening_balance'")).rows[0].count).toBe(14);
  });
});
