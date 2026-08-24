import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrationRunner';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;
const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');

interface OpeningHeaderOptions {
  id: string;
  originLocationId?: string | null;
  destinationLocationId?: string | null;
  quantity?: number | null;
  status?: string;
  receptionStatus?: string;
  correctsMovementId?: string | null;
  receivedTotal?: number | null;
  receivedUnit?: string | null;
  receivedAt?: string | null;
  receptionIdempotencyKey?: string | null;
  receptionPayloadFingerprint?: string | null;
  data?: Record<string, unknown>;
}

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('opening balance canónico con PostgreSQL real', () => {
  let pool: pg.Pool;

  beforeEach(async () => {
    assertDisposableDatabase(testDatabaseUrl!);
    pool ??= new pg.Pool({ connectionString: testDatabaseUrl, max: 4 });
    await pool.query('drop schema if exists public cascade');
    await pool.query('create schema public');
    const client = await pool.connect();
    try {
      await runMigrations(client, migrationsDirectory, { to: '007_opening_balance.sql' });
    } finally {
      client.release();
    }
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  async function insertFixtureEntities(client: pg.PoolClient) {
    await client.query(`
      insert into public.locations (id, name, type) values
        ('origin', 'Origen', 'warehouse'),
        ('destination', 'Destino', 'warehouse');
      insert into public.lots (id, code, variety, campaign, producer, origin)
      values ('lot-a', 'A', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
    `);
  }

  async function insertOpeningHeader(client: pg.PoolClient, options: OpeningHeaderOptions) {
    await client.query(`
      insert into public.movements (
        id, reference, origin_location_id, destination_location_id, quantity,
        movement_date, status, kind, corrects_movement_id, reception_status,
        received_total, received_unit, received_at,
        reception_idempotency_key, reception_payload_fingerprint, data
      ) values (
        $1, $2, $3, $4, $5, current_date, $6, 'opening_balance', $7, $8,
        $9, $10, $11, $12, $13, $14::jsonb
      )
    `, [
      options.id,
      `OPENING-${options.id.toUpperCase()}`,
      options.originLocationId ?? null,
      options.destinationLocationId === undefined ? 'destination' : options.destinationLocationId,
      options.quantity === undefined ? 10 : options.quantity,
      options.status ?? 'completed',
      options.correctsMovementId ?? null,
      options.receptionStatus ?? 'not_applicable',
      options.receivedTotal ?? null,
      options.receivedUnit ?? null,
      options.receivedAt ?? null,
      options.receptionIdempotencyKey ?? null,
      options.receptionPayloadFingerprint ?? null,
      JSON.stringify(options.data ?? { source: 'test' }),
    ]);
  }

  async function insertOpeningItem(
    client: pg.PoolClient,
    movementId: string,
    options: { id?: string; quantity?: number | null; unit?: string | null } = {},
  ) {
    await client.query(`
      insert into public.movement_items
        (id, movement_id, lot_id, dispatched_quantity, unit, data)
      values ($1, $2, 'lot-a', $3, $4, '{"effect":"opening_credit"}')
    `, [
      options.id ?? `${movementId}-item`,
      movementId,
      options.quantity === undefined ? 10 : options.quantity,
      options.unit === undefined ? 'kg' : options.unit,
    ]);
  }

  async function insertValidOpeningBalance(client: pg.PoolClient, id = 'opening') {
    await client.query('begin');
    await insertOpeningHeader(client, { id });
    await insertOpeningItem(client, id);
    await client.query('commit');
  }

  it('acepta únicamente un movimiento completado, sólo destino y con item explícito', async () => {
    const client = await pool.connect();
    try {
      await insertFixtureEntities(client);
      await insertValidOpeningBalance(client);
      const result = await client.query(`
        select movement.origin_location_id, movement.destination_location_id, movement.quantity,
               movement.status, movement.reception_status, movement.data->>'source' as source,
               item.dispatched_quantity, item.unit
        from public.movements movement
        join public.movement_items item on item.movement_id = movement.id
        where movement.id = $1
      `, ['opening']);
      expect(result.rows).toEqual([expect.objectContaining({
        origin_location_id: null,
        destination_location_id: 'destination',
        quantity: '10.000',
        status: 'completed',
        reception_status: 'not_applicable',
        source: 'test',
        dispatched_quantity: '10.000',
        unit: 'kg',
      })]);
    } finally {
      client.release();
    }
  });

  it.each([
    ['destination NULL', { destinationLocationId: null }],
    ['origin no NULL', { originLocationId: 'origin' }],
    ['status distinto de completed', { status: 'pending' }],
    ['reception_status distinto de not_applicable', { receptionStatus: 'pending' }],
    ['corrects_movement_id no NULL', { correctsMovementId: 'opening-reference' }],
    ['received_total no NULL', { receivedTotal: 1 }],
    ['received_unit no NULL', { receivedUnit: 'kg' }],
    ['received_at no NULL', { receivedAt: '2026-08-24T12:00:00Z' }],
    ['idempotencia de recepción no NULL', {
      receptionIdempotencyKey: 'opening-test-key',
      receptionPayloadFingerprint: 'a'.repeat(64),
    }],
    ['data.source ausente', { data: {} }],
    ['data.source no string', { data: { source: 7 } }],
    ['data.source vacío', { data: { source: '' } }],
    ['data.source demasiado largo', { data: { source: 'x'.repeat(121) } }],
  ] satisfies Array<[string, Omit<OpeningHeaderOptions, 'id'>]>)('rechaza %s', async (_label, overrides) => {
    const client = await pool.connect();
    try {
      await insertFixtureEntities(client);
      const headerOverrides = overrides as Omit<OpeningHeaderOptions, 'id'>;
      if (headerOverrides.correctsMovementId) {
        await insertValidOpeningBalance(client, headerOverrides.correctsMovementId);
      }
      await expect(insertOpeningHeader(client, { id: `bad-${randomUUID()}`, ...headerOverrides }))
        .rejects.toMatchObject({ code: '23514' });
    } finally {
      client.release();
    }
  });

  it.each([
    ['quantity de header cero', 'header-quantity', 0, 'kg'],
    ['quantity de item cero', 'item-quantity', 0, 'kg'],
    ['unit de item ausente', 'item-unit', 10, null],
  ] as const)('rechaza %s y permite rollback', async (_label, mode, quantity, unit) => {
    const client = await pool.connect();
    try {
      await insertFixtureEntities(client);
      await client.query('begin');
      if (mode === 'header-quantity') {
        await expect(insertOpeningHeader(client, { id: mode, quantity })).rejects.toMatchObject({ code: '23514' });
      } else {
        await insertOpeningHeader(client, { id: mode });
        await expect(insertOpeningItem(client, mode, { quantity, unit })).rejects.toMatchObject({
          code: mode === 'item-unit' ? '23502' : '23514',
        });
      }
      await client.query('rollback');
      expect((await client.query('select count(*)::int as count from public.movements where id = $1', [mode])).rows[0].count).toBe(0);
    } finally {
      client.release();
    }
  });

  it('rechaza al COMMIT un opening_balance sin movement_items y siempre permite rollback', async () => {
    const client = await pool.connect();
    try {
      await insertFixtureEntities(client);
      await client.query('begin');
      await insertOpeningHeader(client, { id: 'opening-empty' });
      await expect(client.query('commit')).rejects.toMatchObject({ code: '23514' });
      await client.query('rollback');
      expect((await client.query('select count(*)::int as count from public.movements where id = $1', ['opening-empty'])).rows[0].count).toBe(0);
    } finally {
      client.release();
    }
  });

  it.each(['delete', 'move'] as const)('rechaza %s del último item y restaura el vínculo con rollback', async (operation) => {
    const client = await pool.connect();
    try {
      await insertFixtureEntities(client);
      await insertValidOpeningBalance(client);
      if (operation === 'move') {
        await client.query(`
          insert into public.movements
            (id, reference, origin_location_id, destination_location_id, quantity,
             movement_date, status, kind, reception_status, data)
          values ($1, $2, 'origin', 'destination', 10, current_date, 'completed', 'transfer', 'not_applicable', '{}')
        `, ['transfer-target', 'MV-TRANSFER-TARGET']);
      }

      await client.query('begin');
      if (operation === 'delete') {
        await client.query('delete from public.movement_items where id = $1', ['opening-item']);
      } else {
        await client.query('update public.movement_items set movement_id = $1 where id = $2', ['transfer-target', 'opening-item']);
      }
      await expect(client.query('commit')).rejects.toMatchObject({ code: '23514' });
      await client.query('rollback');
      expect((await client.query('select movement_id from public.movement_items where id = $1', ['opening-item'])).rows)
        .toEqual([{ movement_id: 'opening' }]);
    } finally {
      client.release();
    }
  });
});
