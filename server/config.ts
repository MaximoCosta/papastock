const DEFAULT_AI_MODEL = 'openai/gpt-oss-20b';

function normalizeDatabaseUrl(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  const parsed = new URL(candidate);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || !parsed.pathname.slice(1)) {
    throw new Error('DATABASE_URL debe ser una URL PostgreSQL válida con host y base de datos.');
  }
  return candidate;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL),
  groqApiKey: process.env.GROQ_API_KEY?.trim(),
  aiModel: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
  groqTimeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 8000),
  databaseReadinessTimeoutMs: Number(process.env.DATABASE_READINESS_TIMEOUT_MS ?? 1500),
  authUsername: process.env.PAPASTOCK_AUTH_USERNAME?.trim(),
  authPasswordHash: process.env.PAPASTOCK_AUTH_PASSWORD_HASH?.trim(),
  sessionSecret: process.env.PAPASTOCK_SESSION_SECRET?.trim(),
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT debe ser un entero entre 1 y 65535.');
}

if (config.nodeEnv === 'production' && !config.databaseUrl) {
  throw new Error('DATABASE_URL es obligatoria en producción.');
}

if (!Number.isInteger(config.databaseReadinessTimeoutMs) || config.databaseReadinessTimeoutMs < 100 || config.databaseReadinessTimeoutMs > 10_000) {
  throw new Error('DATABASE_READINESS_TIMEOUT_MS debe ser un entero entre 100 y 10000.');
}

if (config.nodeEnv === 'production' && (!config.authUsername || !config.authPasswordHash || !config.sessionSecret)) {
  throw new Error('PAPASTOCK_AUTH_USERNAME, PAPASTOCK_AUTH_PASSWORD_HASH y PAPASTOCK_SESSION_SECRET son obligatorias en producción.');
}
