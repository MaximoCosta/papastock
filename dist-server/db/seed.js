import {
  requirePool
} from "../chunk-CXV6QWMR.js";

// server/db/seed.ts
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
var repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
var sql = await readFile(path.join(repositoryRoot, "migrations", "seed.sql"), "utf8");
var database = requirePool();
var client = await database.connect();
try {
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log("Seed PapaStock aplicado.");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await database.end();
}
