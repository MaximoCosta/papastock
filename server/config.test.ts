import { describe, expect, it } from 'vitest';
import { assertProductionServerConfig, config, groqRuntimeStatus, parseAllowedOrigins } from './config';

describe('configuración del servidor productivo', () => {
  it('sigue exigiendo base y credenciales de autenticación al arrancar el web server', () => {
    expect(() => assertProductionServerConfig({
      ...config,
      nodeEnv: 'production',
      databaseUrl: 'postgresql://database.example/papastock',
      authUsername: undefined,
      authPasswordHash: undefined,
      sessionSecret: undefined,
    })).toThrow('PAPASTOCK_AUTH_USERNAME, PAPASTOCK_AUTH_PASSWORD_HASH y PAPASTOCK_SESSION_SECRET');
  });

  it('acepta la configuración productiva completa', () => {
    expect(() => assertProductionServerConfig({
      ...config,
      nodeEnv: 'production',
      databaseUrl: 'postgresql://database.example/papastock',
      authUsername: 'operador',
      authPasswordHash: 'scrypt$fixture',
      sessionSecret: 'x'.repeat(32),
    })).not.toThrow();
  });

  it('incluye el SPA de Netlify y el origen de Render por defecto', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([
      'https://papastock.onrender.com',
      'https://papstock.netlify.app',
    ]);
    expect(parseAllowedOrigins('https://preview.example')).toContain('https://preview.example');
    expect(() => parseAllowedOrigins('not-a-url')).toThrow('orígenes absolutos');
  });

  it('sólo considera GROQ_API_KEY del proceso; VITE_GROQ_API_KEY no configura Groq', () => {
    expect(groqRuntimeStatus({})).toEqual({ groqConfigured: false, frontendKeyIgnored: false });
    expect(groqRuntimeStatus({ GROQ_API_KEY: 'gsk_fixture' })).toEqual({
      groqConfigured: true,
      frontendKeyIgnored: false,
    });
    expect(groqRuntimeStatus({ VITE_GROQ_API_KEY: 'gsk_frontend_fixture' })).toEqual({
      groqConfigured: false,
      frontendKeyIgnored: true,
    });
    expect(JSON.stringify(groqRuntimeStatus({ VITE_GROQ_API_KEY: 'gsk_frontend_fixture' }))).not.toContain('gsk_');
  });
});
