import type { Pool, PoolClient } from 'pg';
import { parseMigrationArgs, runMigrations, type MigrationSelection } from './migrationRunner';

const PRODUCTION_FLAG = '--apply-production';

type MigrationDatabase = Pick<Pool, 'connect' | 'end'>;

export interface MigrationCommandOptions {
  args: string[];
  nodeEnv: string;
  migrationsDirectory: string;
  log?: (message: string) => void;
  loadDatabase?: () => Promise<MigrationDatabase>;
  migrate?: (client: PoolClient, directory: string, selection: MigrationSelection) => Promise<string[]>;
  render?: boolean;
}

export interface ParsedMigrationCommand {
  applyProduction: boolean;
  selection: MigrationSelection;
}

export function parseMigrationCommandArgs(args: string[]): ParsedMigrationCommand {
  const occurrences = args.filter((argument) => argument === PRODUCTION_FLAG).length;
  if (occurrences > 1) throw new Error(`${PRODUCTION_FLAG} no puede repetirse.`);
  return {
    applyProduction: occurrences === 1,
    selection: parseMigrationArgs(args.filter((argument) => argument !== PRODUCTION_FLAG)),
  };
}

async function loadConfiguredDatabase(): Promise<MigrationDatabase> {
  const { requirePool } = await import('./pool');
  return requirePool();
}

export async function runMigrationCommand(options: MigrationCommandOptions): Promise<{
  skipped: boolean;
  applied: string[];
}> {
  const parsed = parseMigrationCommandArgs(options.args);
  const log = options.log ?? console.log;
  const onRender = options.render ?? process.env.RENDER === 'true';
  if (options.nodeEnv === 'production' && !parsed.applyProduction && !onRender) {
    log('Migraciones de producción omitidas: se requiere --apply-production.');
    return { skipped: true, applied: [] };
  }

  const database = await (options.loadDatabase ?? loadConfiguredDatabase)();
  const client = await database.connect();
  try {
    const applied = await (options.migrate ?? runMigrations)(
      client,
      options.migrationsDirectory,
      parsed.selection,
    );
    log(applied.length ? `Migraciones aplicadas: ${applied.join(', ')}` : 'Migraciones al día.');
    return { skipped: false, applied };
  } finally {
    client.release();
    await database.end();
  }
}
