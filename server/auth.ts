import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type Permission = 'data:read' | 'stock:write' | 'imports:write' | 'ai:use';

export interface AuthIdentity {
  username: string;
  name: string;
  role: 'operator';
  plant: string;
  permissions: Permission[];
}

export interface AuthOptions {
  username: string;
  passwordHash: string;
  sessionSecret: string;
  secureCookies: boolean;
  sessionTtlMs?: number;
}

interface StoredSession {
  identity: AuthIdentity;
  expiresAt: number;
}

const COOKIE_NAME = 'papastock_session';
const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;
const MAX_SESSIONS = 10;

function tokenFingerprint(token: string, secret: string): string {
  return createHash('sha256').update(secret).update('\0').update(token).digest('base64url');
}

function passwordParts(encoded: string): { salt: Buffer; expected: Buffer } | undefined {
  const [algorithm, saltText, hashText] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltText || !hashText) return undefined;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (salt.length < 16 || expected.length !== PASSWORD_KEY_LENGTH) return undefined;
    return { salt, expected };
  } catch {
    return undefined;
  }
}

export function hashPassword(password: string, salt = randomBytes(16)): string {
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

function verifyPassword(password: string, encoded: string): boolean {
  const parts = passwordParts(encoded);
  if (!parts) return false;
  const actual = scryptSync(password, parts.salt, parts.expected.length);
  return timingSafeEqual(actual, parts.expected);
}

function cookieValue(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value || undefined;
  }
  return undefined;
}

export class AuthService {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly ttlMs: number;

  constructor(private readonly options: AuthOptions) {
    if (!options.username.trim()) throw new Error('PAPASTOCK_AUTH_USERNAME es obligatorio.');
    if (!passwordParts(options.passwordHash)) throw new Error('PAPASTOCK_AUTH_PASSWORD_HASH no tiene formato scrypt válido.');
    if (options.sessionSecret.length < 32) throw new Error('PAPASTOCK_SESSION_SECRET debe tener al menos 32 caracteres.');
    this.ttlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  }

  authenticate(username: string, password: string): AuthIdentity | undefined {
    if (username.trim().toLowerCase() !== this.options.username.trim().toLowerCase()) return undefined;
    if (!verifyPassword(password, this.options.passwordHash)) return undefined;
    return {
      username: this.options.username,
      name: 'Operador PapaStock',
      role: 'operator',
      plant: 'Planta Balcarce',
      permissions: ['data:read', 'stock:write', 'imports:write', 'ai:use'],
    };
  }

  createSession(identity: AuthIdentity): { token: string; expiresAt: number } {
    this.removeExpired();
    while (this.sessions.size >= MAX_SESSIONS) {
      const oldest = this.sessions.keys().next().value as string | undefined;
      if (!oldest) break;
      this.sessions.delete(oldest);
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + this.ttlMs;
    this.sessions.set(tokenFingerprint(token, this.options.sessionSecret), { identity, expiresAt });
    return { token, expiresAt };
  }

  readSession(token: string | undefined): AuthIdentity | undefined {
    if (!token) return undefined;
    this.removeExpired();
    return this.sessions.get(tokenFingerprint(token, this.options.sessionSecret))?.identity;
  }

  revokeSession(token: string | undefined): void {
    if (!token) return;
    this.sessions.delete(tokenFingerprint(token, this.options.sessionSecret));
  }

  tokenFrom(request: Request): string | undefined {
    return cookieValue(request.header('cookie'), COOKIE_NAME);
  }

  setSessionCookie(response: Response, token: string): void {
    response.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.options.secureCookies,
      path: '/',
      maxAge: this.ttlMs,
    });
  }

  clearSessionCookie(response: Response): void {
    response.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.options.secureCookies,
      path: '/',
    });
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(key);
    }
  }
}

export function requireAuthentication(auth: AuthService): RequestHandler {
  return (request, response, next) => {
    const identity = auth.readSession(auth.tokenFrom(request));
    if (!identity) return response.status(401).json({ error: 'Autenticación requerida.' });
    response.locals.identity = identity;
    next();
  };
}

export function requirePermission(permission: Permission): RequestHandler {
  return (_request, response, next) => {
    const identity = response.locals.identity as AuthIdentity | undefined;
    if (!identity?.permissions.includes(permission)) {
      return response.status(403).json({ error: 'Permiso insuficiente.' });
    }
    next();
  };
}

export function isTrustedMutationOrigin(options: {
  origin: string | undefined;
  host: string | undefined;
  protocol: string;
  allowedOrigins: readonly string[];
}): boolean {
  if (!options.origin) return false;
  try {
    const parsed = new URL(options.origin);
    if (options.allowedOrigins.includes(parsed.origin)) return true;
    return Boolean(
      options.host
      && parsed.host === options.host
      && parsed.protocol === `${options.protocol}:`,
    );
  } catch {
    return false;
  }
}

export function createSameOriginGuard(allowedOrigins: readonly string[] = []) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
    const forwardedProtocol = request.header('x-forwarded-proto')?.split(',')[0]?.trim();
    const trusted = isTrustedMutationOrigin({
      origin: request.header('origin'),
      host: request.header('host'),
      protocol: forwardedProtocol || request.protocol,
      allowedOrigins,
    });
    if (!trusted) {
      return response.status(403).json({ error: 'Origen de solicitud no permitido.' });
    }
    next();
  };
}

export const requireSameOrigin = createSameOriginGuard();
