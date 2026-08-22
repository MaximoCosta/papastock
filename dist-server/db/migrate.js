import {
  requirePool
} from "../chunk-CXV6QWMR.js";

// server/db/migrate.ts
import path2 from "path";
import { fileURLToPath } from "url";

// server/db/migrationRunner.ts
import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import path from "path";
var MIGRATION_LOCK_ID = 1724204;
async function runMigrations(client2, directory) {
  const files = (await readdir(directory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  await client2.query("select pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
  try {
    await client2.query(`
      create table if not exists public.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);
    const applied = [];
    for (const name of files) {
      const sql = await readFile(path.join(directory, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client2.query(
        "select checksum from public.schema_migrations where name = $1",
        [name]
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`La migraci\xF3n aplicada ${name} cambi\xF3 de contenido.`);
        }
        continue;
      }
      await client2.query("begin");
      try {
        await client2.query(sql);
        await client2.query(
          "insert into public.schema_migrations (name, checksum) values ($1, $2)",
          [name, checksum]
        );
        await client2.query("commit");
        applied.push(name);
      } catch (error) {
        await client2.query("rollback");
        throw error;
      }
    }
    return applied;
  } finally {
    await client2.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
  }
}

// server/db/migrate.ts
var repositoryRoot = path2.resolve(path2.dirname(fileURLToPath(import.meta.url)), "../..");
var database = requirePool();
var client = await database.connect();
try {
  const applied = await runMigrations(client, path2.join(repositoryRoot, "migrations"));
  console.log(applied.length ? `Migraciones aplicadas: ${applied.join(", ")}` : "Migraciones al d\xEDa.");
} finally {
  client.release();
  await database.end();
}
