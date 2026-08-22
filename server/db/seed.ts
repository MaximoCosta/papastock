import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirePool } from './pool';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sql = await readFile(path.join(repositoryRoot, 'migrations', 'seed.sql'), 'utf8');
const database = requirePool();
const client = await database.connect();

try {
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('Seed PapaStock aplicado.');
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  client.release();
  await database.end();
}
