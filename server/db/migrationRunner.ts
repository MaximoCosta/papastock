import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type pg from 'pg';

const MIGRATION_LOCK_ID = 1_724_204;

export interface MigrationSelection {
  to?: string;
  only?: string;
}

export function parseMigrationArgs(args: string[]): MigrationSelection {
  const selection: MigrationSelection = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const [flag, inlineValue] = argument.split('=', 2);
    if (flag !== '--to' && flag !== '--only') {
      throw new Error(`Argumento de migración desconocido: ${argument}`);
    }
    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith('--')) {
      throw new Error(`${flag} requiere el nombre completo de una migración.`);
    }
    if (!/^\d+_.+\.sql$/.test(value)) {
      throw new Error(`Nombre de migración inválido: ${value}`);
    }
    const key = flag === '--to' ? 'to' : 'only';
    if (selection[key]) throw new Error(`${flag} no puede repetirse.`);
    selection[key] = value;
  }
  if (selection.to && selection.only) {
    throw new Error('--to y --only son mutuamente excluyentes.');
  }
  return selection;
}

export async function runMigrations(
  client: pg.PoolClient,
  directory: string,
  selection: MigrationSelection = {},
): Promise<string[]> {
  const files = (await readdir(directory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
  const target = selection.to ?? selection.only;
  if (target && !files.includes(target)) {
    throw new Error(`La migración objetivo no existe: ${target}`);
  }

  await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const appliedRows = await client.query<{ name: string; checksum: string }>(
      'select name, checksum from public.schema_migrations order by name',
    );
    const appliedByName = new Map(appliedRows.rows.map((row) => [row.name, row.checksum]));
    const unknownApplied = [...appliedByName.keys()].filter((name) => !files.includes(name));
    if (unknownApplied.length) {
      throw new Error(`Hay migraciones aplicadas sin archivo local: ${unknownApplied.join(', ')}.`);
    }

    const checksums = new Map<string, string>();
    for (const name of files) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      checksums.set(name, checksum);
      const existingChecksum = appliedByName.get(name);
      if (existingChecksum && existingChecksum !== checksum) {
        throw new Error(`La migración aplicada ${name} cambió de contenido.`);
      }
    }

    const firstPendingIndex = files.findIndex((name) => !appliedByName.has(name));
    const appliedPrefixLength = firstPendingIndex === -1 ? files.length : firstPendingIndex;
    const outOfOrder = files.slice(appliedPrefixLength + 1).filter((name) => appliedByName.has(name));
    if (outOfOrder.length) {
      throw new Error(`El historial de migraciones está fuera de orden: ${outOfOrder.join(', ')}.`);
    }

    let selectedFiles: string[];
    if (selection.only) {
      const targetIndex = files.indexOf(selection.only);
      if (targetIndex < appliedPrefixLength) {
        if (targetIndex !== appliedPrefixLength - 1) {
          throw new Error(`--only ${selection.only} quedó detrás de migraciones posteriores ya aplicadas.`);
        }
        selectedFiles = [];
      } else if (targetIndex !== appliedPrefixLength) {
        const required = files[appliedPrefixLength];
        throw new Error(`--only no puede saltar dependencias. Primero debe aplicarse ${required}.`);
      } else {
        selectedFiles = [selection.only];
      }
    } else if (selection.to) {
      const targetIndex = files.indexOf(selection.to);
      if (targetIndex < appliedPrefixLength - 1) {
        throw new Error(`--to ${selection.to} quedó detrás de migraciones posteriores ya aplicadas.`);
      }
      selectedFiles = files.slice(appliedPrefixLength, targetIndex + 1);
    } else {
      selectedFiles = files.slice(appliedPrefixLength);
    }

    const applied: string[] = [];
    for (const name of selectedFiles) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      const checksum = checksums.get(name)!;

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
