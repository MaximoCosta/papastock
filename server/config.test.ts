import { describe, expect, it } from 'vitest';
import { assertProductionServerConfig, config } from './config';

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
});
