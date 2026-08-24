import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrationCommand } from './migrationCommand';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

await runMigrationCommand({
  args: process.argv.slice(2),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  migrationsDirectory: path.join(repositoryRoot, 'migrations'),
});
