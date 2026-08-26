import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrationCommand } from './migrationCommand';
import { config } from '../config';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

if (config.backendMode === 'java') {
  console.log('Migraciones legacy omitidas: PAPASTOCK_BACKEND_MODE=java.');
  process.exit(0);
}

await runMigrationCommand({
  args: process.argv.slice(2),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  migrationsDirectory: path.join(repositoryRoot, 'migrations'),
});
