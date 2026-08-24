import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type pg from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseMigrationArgs, runMigrations } from './migrationRunner';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function migrationDirectory(): Promise<{ directory: string; sql: Record<string, string> }> {
  const directory = await mkdtemp(path.join(tmpdir(), 'papastock-migrations-'));
  directories.push(directory);
  const sql = {
    '001_first.sql': 'select 1;',
    '002_second.sql': 'select 2;',
    '003_third.sql': 'select 3;',
  };
  await Promise.all(Object.entries(sql).map(([name, contents]) => writeFile(path.join(directory, name), contents)));
  return { directory, sql };
}

function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

function fakeClient(initial: Array<{ name: string; checksum: string }> = [], failSql?: string) {
  const applied = [...initial];
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql === 'select name, checksum from public.schema_migrations order by name') return { rows: [...applied] };
    if (sql === failSql) throw new Error('forced migration failure');
    if (sql.startsWith('insert into public.schema_migrations')) {
      applied.push({ name: String(params?.[0]), checksum: String(params?.[1]) });
    }
    return { rows: [], rowCount: 1 };
  });
  return { client: { query } as unknown as pg.PoolClient, query, applied };
}

describe('argumentos del runner de migraciones', () => {
  it('acepta --to/--only separados o inline', () => {
    expect(parseMigrationArgs(['--to', '004_x.sql'])).toEqual({ to: '004_x.sql' });
    expect(parseMigrationArgs(['--only=005_y.sql'])).toEqual({ only: '005_y.sql' });
  });

  it.each([
    [['--to'], 'requiere'],
    [['--only', '5.sql'], 'inválido'],
    [['--to', '004_x.sql', '--only', '005_y.sql'], 'mutuamente'],
    [['--force', '004_x.sql'], 'desconocido'],
  ])('rechaza argumentos inseguros %#', (args, message) => {
    expect(() => parseMigrationArgs(args)).toThrow(message);
  });
});

describe('selección y garantías del runner', () => {
  it('aplica pendientes hasta --to inclusive y conserva lock/transacciones/checksum', async () => {
    const { directory, sql } = await migrationDirectory();
    const { client, query, applied } = fakeClient([{ name: '001_first.sql', checksum: checksum(sql['001_first.sql']) }]);
    await expect(runMigrations(client, directory, { to: '002_second.sql' })).resolves.toEqual(['002_second.sql']);
    expect(applied.map((row) => row.name)).toEqual(['001_first.sql', '002_second.sql']);
    expect(query).toHaveBeenCalledWith('select pg_advisory_lock($1)', [1_724_204]);
    expect(query).toHaveBeenCalledWith('begin');
    expect(query).toHaveBeenCalledWith('commit');
    expect(query).toHaveBeenCalledWith('select pg_advisory_unlock($1)', [1_724_204]);
  });

  it('permite --only únicamente para la próxima migración', async () => {
    const { directory, sql } = await migrationDirectory();
    const initial = [{ name: '001_first.sql', checksum: checksum(sql['001_first.sql']) }];
    await expect(runMigrations(fakeClient(initial).client, directory, { only: '002_second.sql' })).resolves.toEqual(['002_second.sql']);
    await expect(runMigrations(fakeClient(initial).client, directory, { only: '003_third.sql' })).rejects.toThrow('no puede saltar dependencias');
  });

  it('rechaza checksums modificados e historial fuera de orden', async () => {
    const { directory, sql } = await migrationDirectory();
    await expect(runMigrations(fakeClient([{ name: '001_first.sql', checksum: 'bad' }]).client, directory)).rejects.toThrow('cambió de contenido');
    await expect(runMigrations(fakeClient([{ name: '002_second.sql', checksum: checksum(sql['002_second.sql']) }]).client, directory)).rejects.toThrow('fuera de orden');
  });

  it('hace rollback de la migración fallida y libera el advisory lock', async () => {
    const { directory } = await migrationDirectory();
    const { client, query } = fakeClient([], 'select 1;');
    await expect(runMigrations(client, directory, { only: '001_first.sql' })).rejects.toThrow('forced migration failure');
    expect(query).toHaveBeenCalledWith('rollback');
    expect(query).toHaveBeenCalledWith('select pg_advisory_unlock($1)', [1_724_204]);
  });
});
