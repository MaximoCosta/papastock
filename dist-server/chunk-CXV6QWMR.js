// server/config.ts
var DEFAULT_AI_MODEL = "openai/gpt-oss-20b";
function normalizeDatabaseUrl(value) {
  const candidate = value?.trim();
  if (!candidate) return void 0;
  const parsed = new URL(candidate);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname || !parsed.pathname.slice(1)) {
    throw new Error("DATABASE_URL debe ser una URL PostgreSQL v\xE1lida con host y base de datos.");
  }
  return candidate;
}
var config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3e3),
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL),
  groqApiKey: process.env.GROQ_API_KEY?.trim(),
  aiModel: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
  groqTimeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 8e3)
};
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("PORT debe ser un entero entre 1 y 65535.");
}
if (config.nodeEnv === "production" && !config.databaseUrl) {
  throw new Error("DATABASE_URL es obligatoria en producci\xF3n.");
}

// server/db/pool.ts
import pg from "pg";
var { Pool } = pg;
var pool = config.databaseUrl ? new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3,
  application_name: "papastock-web"
}) : void 0;
pool?.on("error", (error) => {
  console.error("[database] conexi\xF3n inactiva fall\xF3", error);
});
function requirePool() {
  if (!pool) throw new Error("DATABASE_URL no est\xE1 configurada.");
  return pool;
}
async function verifyDatabaseConnection() {
  await requirePool().query("select 1");
}

export {
  config,
  pool,
  requirePool,
  verifyDatabaseConnection
};
