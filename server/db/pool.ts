import pg from 'pg';
import { config } from '../config';

const { Pool } = pg;

export const pool = config.databaseUrl
  ? new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: 'papastock-web',
    })
  : undefined;

pool?.on('error', (error) => {
  console.error('[database] conexión inactiva falló', error);
});

export function requirePool(): pg.Pool {
  if (!pool) throw new Error('DATABASE_URL no está configurada.');
  return pool;
}

export async function verifyDatabaseConnection(): Promise<void> {
  await requirePool().query('select 1');
}
