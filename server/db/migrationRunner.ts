import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type pg from 'pg';

const MIGRATION_LOCK_ID = 1_724_204;

export async function runMigrations(client: pg.PoolClient, directory: string): Promise<string[]> {
  const files = (await readdir(directory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();

  await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const applied: string[] = [];
    for (const name of files) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query<{ checksum: string }>(
        'select checksum from public.schema_migrations where name = $1',
        [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`La migración aplicada ${name} cambió de contenido.`);
        }
        continue;
      }

      await client.query('begin');
      try {
        await client.query(sql);
        await client.query(
          'insert into public.schema_migrations (name, checksum) values ($1, $2)',
          [name, checksum],
        );
        await client.query('commit');
        applied.push(name);
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
    return applied;
  } finally {
    await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
  }
}
