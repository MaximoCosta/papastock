import type pg from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDatabaseReadiness } from './pool';

afterEach(() => vi.useRealTimers());

describe('checkDatabaseReadiness', () => {
  it('acepta una consulta PostgreSQL disponible', async () => {
    const database = { query: vi.fn(async () => ({ rows: [{ '?column?': 1 }] })) } as unknown as pg.Pool;
    await expect(checkDatabaseReadiness(database, 100)).resolves.toBeUndefined();
    expect(database.query).toHaveBeenCalledWith('select 1');
  });

  it('corta una consulta que no responde dentro del timeout', async () => {
    vi.useFakeTimers();
    const database = { query: vi.fn(() => new Promise(() => undefined)) } as unknown as pg.Pool;
    const readiness = checkDatabaseReadiness(database, 100);
    const rejection = expect(readiness).rejects.toThrow('readiness timeout');
    await vi.advanceTimersByTimeAsync(100);
    await rejection;
  });
});
