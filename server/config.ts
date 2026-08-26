const DEFAULT_AI_MODEL = 'openai/gpt-oss-20b';

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://papastock.onrender.com',
  'https://papstock.netlify.app',
] as const;

export function parseAllowedOrigins(
  value: string | undefined,
  defaults: readonly string[] = DEFAULT_ALLOWED_ORIGINS,
): string[] {
  const origins = new Set<string>();
  for (const candidate of [...defaults, ...(value ?? '').split(',')]) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error('PAPASTOCK_ALLOWED_ORIGINS debe ser una lista de orígenes absolutos separados por coma.');
    }
    if (parsed.username || parsed.password || parsed.origin === 'null') {
      throw new Error('PAPASTOCK_ALLOWED_ORIGINS contiene un origen inválido.');
    }
    origins.add(parsed.origin);
  }
  return [...origins];
}

function normalizeDatabaseUrl(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  const parsed = new URL(candidate);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || !parsed.pathname.slice(1)) {
    throw new Error('DATABASE_URL debe ser una URL PostgreSQL válida con host y base de datos.');
  }
  return candidate;
}

/** Groq vive en Express (`GROQ_API_KEY`). Una `VITE_*` no configura el modelo y puede filtrarse al bundle. */
export function groqRuntimeStatus(
  env: { GROQ_API_KEY?: string; VITE_GROQ_API_KEY?: string } = process.env,
) {
  const groqConfigured = Boolean(env.GROQ_API_KEY?.trim());
  return {
    groqConfigured,
    frontendKeyIgnored: Boolean(env.VITE_GROQ_API_KEY?.trim()) && !groqConfigured,
  };
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL),
  groqApiKey: process.env.GROQ_API_KEY?.trim(),
  aiModel: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
  groqTimeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 8000),
  groqMaxRequestBodyBytes: Number(process.env.GROQ_MAX_REQUEST_BODY_BYTES ?? 20_000),
  databaseReadinessTimeoutMs: Number(process.env.DATABASE_READINESS_TIMEOUT_MS ?? 1500),
  authUsername: process.env.PAPASTOCK_AUTH_USERNAME?.trim(),
  authPasswordHash: process.env.PAPASTOCK_AUTH_PASSWORD_HASH?.trim(),
  sessionSecret: process.env.PAPASTOCK_SESSION_SECRET?.trim(),
  allowedOrigins: parseAllowedOrigins(process.env.PAPASTOCK_ALLOWED_ORIGINS),
};

export type PapaStockConfig = typeof config;

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT debe ser un entero entre 1 y 65535.');
}

if (!Number.isInteger(config.databaseReadinessTimeoutMs) || config.databaseReadinessTimeoutMs < 100 || config.databaseReadinessTimeoutMs > 10_000) {
  throw new Error('DATABASE_READINESS_TIMEOUT_MS debe ser un entero entre 100 y 10000.');
}

if (!Number.isInteger(config.groqMaxRequestBodyBytes)
  || config.groqMaxRequestBodyBytes < 2_000
  || config.groqMaxRequestBodyBytes > 512_000) {
  throw new Error('GROQ_MAX_REQUEST_BODY_BYTES debe ser un entero entre 2000 y 512000.');
}

export function assertProductionServerConfig(candidate: PapaStockConfig = config): void {
  if (candidate.nodeEnv !== 'production') return;
  if (!candidate.databaseUrl) {
    throw new Error('DATABASE_URL es obligatoria en producción.');
  }
  if (!candidate.authUsername || !candidate.authPasswordHash || !candidate.sessionSecret) {
    throw new Error('PAPASTOCK_AUTH_USERNAME, PAPASTOCK_AUTH_PASSWORD_HASH y PAPASTOCK_SESSION_SECRET son obligatorias en producción.');
  }
}
