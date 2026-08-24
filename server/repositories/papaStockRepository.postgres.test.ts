import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrationRunner';
import { checkDatabaseReadiness } from '../db/pool';
import { PapaStockRepository } from './papaStockRepository';

const testDatabaseUrl = process.env.PAPASTOCK_TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;

function assertDisposableDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('PAPASTOCK_TEST_DATABASE_URL debe apuntar a una base cuyo nombre contenga "test".');
  }
}

describePostgres.sequential('PapaStockRepository con PostgreSQL real', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    assertDisposableDatabase(testDatabaseUrl!);
    pool = new pg.Pool({ connectionString: testDatabaseUrl, max: 8 });
    await pool.query('drop schema if exists public cascade');
    await pool.query('create schema public');
    const client = await pool.connect();
    try {
      const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');
      await runMigrations(client, migrationsDirectory);
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
    await pool.query('drop trigger if exists reject_correction_for_test on public.movements');
    await pool.query('drop function if exists public.reject_correction_for_test()');
  });

  afterAll(async () => {
    await pool?.end();
  });

  async function seedCorrectionFixture(): Promise<void> {
    await pool.query(`
      insert into public.locations (id, name, type) values
        ('loc-origin', 'Origen', 'warehouse'),
        ('loc-target', 'Destino', 'cold_storage');
      insert into public.lots (id, code, variety, campaign, producer, origin) values
        ('lot-from', 'FROM', 'Spunta', '2025/26', 'Papasud', 'Balcarce'),
        ('lot-to', 'TO', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
      insert into public.movements
        (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, kind, reception_status)
      values
        ('movement-original', 'MV-ORIGINAL', null, 'loc-origin', 'loc-target', 20, current_date, 'completed', 'transfer', 'received');
      insert into public.movement_items
        (id, movement_id, lot_id, dispatched_quantity, received_quantity, received_at, unit, sort_order)
      values
        ('item-original', 'movement-original', 'lot-from', 20, 20, now(), 'kg', 0);
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-to', 'lot-to', 'loc-target', 20, 20, false, 'kg');
    `);
  }

  async function seedReceptionFixture(): Promise<void> {
    await pool.query(`
      insert into public.locations (id, name, type) values
        ('loc-origin', 'Origen', 'warehouse'),
        ('loc-target', 'Destino', 'cold_storage');
      insert into public.lots (id, code, variety, campaign, producer, origin) values
        ('lot-reception', 'R-001', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
      insert into public.movements
        (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, kind, reception_status)
      values
        ('movement-reception', 'MV-RECEPTION', null, 'loc-origin', 'loc-target', 10, current_date, 'completed', 'transfer', 'pending');
      insert into public.movement_items
        (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
      values
        ('item-reception', 'movement-reception', 'lot-reception', 10, 'kg', 0);
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-reception', 'lot-reception', 'loc-target', 10, 10, false, 'kg');
    `);
  }

  async function seedVerificationFixture(): Promise<void> {
    await pool.query(`
      insert into public.locations (id, name, type) values ('loc-verify', 'Verificación', 'warehouse');
      insert into public.lots (id, code, variety, campaign, producer, origin) values
        ('lot-verify', 'V-001', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-verify', 'lot-verify', 'loc-verify', 10, 10, true, 'kg');
    `);
  }

  it('permite una corrección en una ubicación pero rechaza un traslado con extremos iguales', async () => {
    await seedCorrectionFixture();
    const repository = new PapaStockRepository(pool);

    const correction = await repository.executeLotCorrection({
      originalMovementId: 'movement-original',
      locationId: 'loc-target',
      fromLotCode: 'FROM',
      toLotCode: 'TO',
      quantity: 5,
      unit: 'kg',
    });

    expect(correction).toMatchObject({ kind: 'correction', correctsMovementId: 'movement-original' });
    const stock = await pool.query<{ lot_id: string; declared_quantity: string; verified_quantity: string }>(
      'select lot_id, declared_quantity, verified_quantity from public.stock_records order by lot_id',
    );
    expect(stock.rows).toEqual([
      { lot_id: 'lot-from', declared_quantity: '5.000', verified_quantity: '5.000' },
      { lot_id: 'lot-to', declared_quantity: '15.000', verified_quantity: '15.000' },
    ]);

    await expect(pool.query(`
      insert into public.movements
        (id, reference, origin_location_id, destination_location_id, quantity, movement_date, status, kind, reception_status)
      values ('invalid-transfer', 'MV-INVALID', 'loc-target', 'loc-target', 1, current_date, 'completed', 'transfer', 'pending')
    `)).rejects.toMatchObject({ code: '23514' });
  });

  it('revierte restore y deduct si falla la creación del movimiento de corrección', async () => {
    await seedCorrectionFixture();
    await pool.query(`
      create function public.reject_correction_for_test() returns trigger language plpgsql as $$
      begin
        if new.kind = 'correction' then
          raise exception 'forced correction failure';
        end if;
        return new;
      end;
      $$;
      create trigger reject_correction_for_test before insert on public.movements
      for each row execute function public.reject_correction_for_test();
    `);

    const repository = new PapaStockRepository(pool);
    await expect(repository.executeLotCorrection({
      originalMovementId: 'movement-original',
      locationId: 'loc-target',
      fromLotCode: 'FROM',
      toLotCode: 'TO',
      quantity: 5,
      unit: 'kg',
    })).rejects.toThrow('forced correction failure');

    const stock = await pool.query<{ lot_id: string; verified_quantity: string }>(
      'select lot_id, verified_quantity from public.stock_records order by lot_id',
    );
    expect(stock.rows).toEqual([{ lot_id: 'lot-to', verified_quantity: '20.000' }]);
  });

  it('serializa dos recepciones con la misma key y aplica sus efectos una sola vez', async () => {
    await seedReceptionFixture();
    const input = {
      movementId: 'movement-reception',
      idempotencyKey: 'receipt-concurrent-0001',
      date: '2026-08-23',
      items: [{ movementItemId: 'item-reception', receivedQuantity: 8 }],
    };

    const [first, replay] = await Promise.all([
      new PapaStockRepository(pool).executeReception(input),
      new PapaStockRepository(pool).executeReception(input),
    ]);

    expect(first.movement.receptionStatus).toBe('received');
    expect(replay.movement.receptionStatus).toBe('received');
    expect(first.discrepancies).toHaveLength(1);
    expect(replay.discrepancies).toHaveLength(1);
    const stock = await pool.query<{ verified_quantity: string }>(
      "select verified_quantity from public.stock_records where id = 'stock-reception'",
    );
    const effects = await pool.query<{ discrepancies: string; traces: string }>(`
      select
        (select count(*) from public.discrepancies where movement_id = 'movement-reception')::text as discrepancies,
        (select count(*) from public.traceability_events where data->>'reference' = 'MV-RECEPTION')::text as traces
    `);
    expect(stock.rows[0].verified_quantity).toBe('8.000');
    expect(effects.rows[0]).toEqual({ discrepancies: '1', traces: '1' });
  });

  it('rechaza payload distinto con la misma key y key distinta sobre estado terminal', async () => {
    await seedReceptionFixture();
    const repository = new PapaStockRepository(pool);
    const first = {
      movementId: 'movement-reception', idempotencyKey: 'receipt-conflict-0001', date: '2026-08-23',
      items: [{ movementItemId: 'item-reception', receivedQuantity: 8 }],
    };
    await repository.executeReception(first);

    await expect(repository.executeReception({
      ...first,
      items: [{ movementItemId: 'item-reception', receivedQuantity: 7 }],
    })).rejects.toMatchObject({ status: 409 });
    await expect(repository.executeReception({
      ...first,
      idempotencyKey: 'receipt-different-0001',
    })).rejects.toMatchObject({ status: 409 });
  });

  it('permite una sola verificación cuando dos confirmaciones compiten con la misma versión', async () => {
    await seedVerificationFixture();
    const attempts = await Promise.allSettled([
      new PapaStockRepository(pool).executeStockVerification({
        stockRecordId: 'stock-verify', expectedVersion: 0, countedQuantity: 8, date: '2026-08-23',
      }),
      new PapaStockRepository(pool).executeStockVerification({
        stockRecordId: 'stock-verify', expectedVersion: 0, countedQuantity: 7, date: '2026-08-23',
      }),
    ]);

    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = attempts.find((result) => result.status === 'rejected');
    expect(rejected).toMatchObject({ reason: { status: 409 } });
    const stock = await pool.query<{ verified_quantity: string; version: number }>(
      "select verified_quantity, version from public.stock_records where id = 'stock-verify'",
    );
    const traces = await pool.query<{ count: string }>(
      "select count(*)::text as count from public.traceability_events where lot_id = 'lot-verify' and event_type = 'stock_verification'",
    );
    expect(['7.000', '8.000']).toContain(stock.rows[0].verified_quantity);
    expect(stock.rows[0].version).toBe(1);
    expect(traces.rows[0].count).toBe('1');
  });

  it('rechaza una verificación cuyo preview quedó obsoleto por otra mutación de stock', async () => {
    await seedVerificationFixture();
    await pool.query("update public.stock_records set verified_quantity = 9, version = version + 1 where id = 'stock-verify'");

    await expect(new PapaStockRepository(pool).executeStockVerification({
      stockRecordId: 'stock-verify', expectedVersion: 0, countedQuantity: 8, date: '2026-08-23',
    })).rejects.toMatchObject({ status: 409 });
  });

  it('demuestra que el seed no satisface rebuildStockFromLedger = stock_records', async () => {
    const seedSql = await readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations/seed.sql'), 'utf8');
    await pool.query(seedSql);

    const audit = await pool.query<{ code: string; declared_quantity: string; ledger_quantity: string }>(`
      with ledger as (
        select
          items.lot_id,
          movements.destination_location_id as location_id,
          items.unit,
          sum(items.dispatched_quantity) as quantity
        from public.movement_items items
        join public.movements movements on movements.id = items.movement_id
        where movements.status <> 'cancelled' and movements.destination_location_id is not null
        group by items.lot_id, movements.destination_location_id, items.unit
      )
      select lots.code, stock.declared_quantity::text, coalesce(ledger.quantity, 0)::text as ledger_quantity
      from public.stock_records stock
      join public.lots lots on lots.id = stock.lot_id
      left join ledger on ledger.lot_id = stock.lot_id and ledger.location_id = stock.location_id and ledger.unit = stock.unit
      where stock.declared_quantity <> coalesce(ledger.quantity, 0)
      order by lots.code
    `);

    expect(audit.rows.map((row) => row.code)).toEqual(expect.arrayContaining(['A-204', 'B-221', '300', '301']));
  });

  it('mantiene un único snapshot aunque otra conexión confirme datos entre consultas', async () => {
    await pool.query(`
      insert into public.locations (id, name, type) values ('loc-snapshot-old', 'Anterior', 'warehouse');
      insert into public.lots (id, code, variety, campaign, producer, origin) values
        ('lot-snapshot-old', 'S-OLD', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
      insert into public.stock_records
        (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
      values
        ('stock-snapshot-old', 'lot-snapshot-old', 'loc-snapshot-old', 1, 1, false, 'kg');
    `);

    let writerCommitted = false;
    const wrappedPool = {
      connect: async () => {
        const client = await pool.connect();
        let queue = Promise.resolve<unknown>(undefined);
        return {
          query: (sql: string, params?: unknown[]) => {
            const operation = queue.then(async () => {
              const result = await client.query(sql, params);
              if (sql.includes('from public.locations order by id') && !writerCommitted) {
                await pool.query(`
                  insert into public.locations (id, name, type) values ('loc-snapshot-new', 'Nueva', 'warehouse');
                  insert into public.lots (id, code, variety, campaign, producer, origin) values
                    ('lot-snapshot-new', 'S-NEW', 'Spunta', '2025/26', 'Papasud', 'Balcarce');
                  insert into public.stock_records
                    (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, unit)
                  values
                    ('stock-snapshot-new', 'lot-snapshot-new', 'loc-snapshot-new', 2, 2, false, 'kg');
                `);
                writerCommitted = true;
              }
              return result;
            });
            queue = operation.then(() => undefined, () => undefined);
            return operation;
          },
          release: () => client.release(),
        };
      },
    } as unknown as pg.Pool;

    const snapshot = await new PapaStockRepository(wrappedPool).loadSnapshot();
    expect(writerCommitted).toBe(true);
    expect(snapshot.locations.map((item) => item.id)).toEqual(['loc-snapshot-old']);
    expect(snapshot.lots.map((item) => item.id)).toEqual(['lot-snapshot-old']);
    expect(snapshot.stockRecords.map((item) => item.id)).toEqual(['stock-snapshot-old']);
  });

  it('verifica readiness contra PostgreSQL real', async () => {
    await expect(checkDatabaseReadiness(pool, 1000)).resolves.toBeUndefined();
  });
});
