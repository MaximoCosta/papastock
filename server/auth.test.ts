import { describe, expect, it } from 'vitest';
import { AuthService, hashPassword } from './auth';

const password = 'una-clave-segura-de-prueba';

function service(ttl = 60_000) {
  return new AuthService({
    username: 'operador',
    passwordHash: hashPassword(password, Buffer.alloc(16, 3)),
    sessionSecret: 'test-session-secret-with-at-least-32-characters',
    secureCookies: true,
    sessionTtlMs: ttl,
  });
}

describe('AuthService', () => {
  it('valida el hash scrypt y nunca acepta una contraseña distinta', () => {
    expect(service().authenticate('operador', password)?.role).toBe('operator');
    expect(service().authenticate('operador', 'contraseña-equivocada')).toBeUndefined();
  });

  it('crea una sesión opaca y la invalida al cerrar sesión', () => {
    const auth = service();
    const identity = auth.authenticate('operador', password)!;
    const session = auth.createSession(identity);
    expect(session.token).not.toContain('operador');
    expect(auth.readSession(session.token)).toMatchObject({ username: 'operador' });
    auth.revokeSession(session.token);
    expect(auth.readSession(session.token)).toBeUndefined();
  });

  it('descarta sesiones vencidas', async () => {
    const auth = service(1);
    const session = auth.createSession(auth.authenticate('operador', password)!);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(auth.readSession(session.token)).toBeUndefined();
  });
});
