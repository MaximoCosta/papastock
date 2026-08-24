import type { Pool, PoolClient } from 'pg';
import { applyShowcaseDataset, type ShowcaseDatasetResult } from './showcaseDataset';

const PRODUCTION_FLAG = '--apply-production';
type ShowcaseDatabase = Pick<Pool, 'connect' | 'end'>;

export interface ShowcaseCommandOptions {
  args: string[];
  nodeEnv: string;
  log?: (message: string) => void;
  loadDatabase?: () => Promise<ShowcaseDatabase>;
  apply?: (client: PoolClient) => Promise<ShowcaseDatasetResult>;
}

export function parseShowcaseCommandArgs(args: string[]): { applyProduction: boolean } {
  const unknown = args.filter((argument) => argument !== PRODUCTION_FLAG);
  const occurrences = args.length - unknown.length;
  if (unknown.length) throw new Error(`Argumento desconocido para db:showcase: ${unknown[0]}.`);
  if (occurrences > 1) throw new Error(`${PRODUCTION_FLAG} no puede repetirse.`);
  return { applyProduction: occurrences === 1 };
}

async function loadConfiguredDatabase(): Promise<ShowcaseDatabase> {
  const { requirePool } = await import('./pool');
  return requirePool();
}

export async function runShowcaseCommand(options: ShowcaseCommandOptions): Promise<{ skipped: boolean; created: boolean }> {
  const { applyProduction } = parseShowcaseCommandArgs(options.args);
  const log = options.log ?? console.log;
  if (options.nodeEnv === 'production' && !applyProduction) {
    log('Showcase de producción omitido: se requiere --apply-production.');
    return { skipped: true, created: false };
  }
  const database = await (options.loadDatabase ?? loadConfiguredDatabase)();
  const client = await database.connect();
  try {
    const result = await (options.apply ?? applyShowcaseDataset)(client);
    log(result.created ? 'Showcase PapaStock aplicado.' : 'Showcase PapaStock ya estaba aplicado; sin cambios.');
    return { skipped: false, created: result.created };
  } finally {
    client.release();
    await database.end();
  }
}
