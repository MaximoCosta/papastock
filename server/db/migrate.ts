import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePool } from './pool';
import { parseMigrationArgs, runMigrations } from './migrationRunner';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const database = requirePool();
const client = await database.connect();

try {
  const selection = parseMigrationArgs(process.argv.slice(2));
  const applied = await runMigrations(client, path.join(repositoryRoot, 'migrations'), selection);
  console.log(applied.length ? `Migraciones aplicadas: ${applied.join(', ')}` : 'Migraciones al día.');
} finally {
  client.release();
  await database.end();
}
