import pg from 'pg';
import { config } from '../config';

const { Pool } = pg;

export const pool = config.backendMode === 'legacy' && config.databaseUrl
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

export async function checkDatabaseReadiness(database: pg.Pool, timeoutMs: number): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const query = database.query('select 1');
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('PostgreSQL readiness timeout.')), timeoutMs);
  });
  try {
    await Promise.race([query, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function verifyDatabaseReadiness(): Promise<void> {
  await checkDatabaseReadiness(requirePool(), config.databaseReadinessTimeoutMs);
}
