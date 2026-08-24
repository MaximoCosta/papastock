import type { PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { parseShowcaseCommandArgs, runShowcaseCommand } from './showcaseCommand';

function fakeExecution() {
  const release = vi.fn();
  const connect = vi.fn(async () => ({ release } as unknown as PoolClient));
  const end = vi.fn(async () => undefined);
  const loadDatabase = vi.fn(async () => ({ connect, end }));
  const apply = vi.fn(async () => ({ created: true, showcaseCoordinates: [] }));
  return { release, connect, end, loadDatabase, apply };
}

describe('comando seguro del Showcase', () => {
  it('omite producción sin autorización antes de cargar o conectar la base', async () => {
    const execution = fakeExecution();
    const log = vi.fn();
    await expect(runShowcaseCommand({ args: [], nodeEnv: 'production', log, loadDatabase: execution.loadDatabase, apply: execution.apply })).resolves.toEqual({ skipped: true, created: false });
    expect(log).toHaveBeenCalledWith('Showcase de producción omitido: se requiere --apply-production.');
    expect(execution.loadDatabase).not.toHaveBeenCalled();
    expect(execution.connect).not.toHaveBeenCalled();
    expect(execution.apply).not.toHaveBeenCalled();
  });

  it('sólo acepta una autorización productiva explícita', () => {
    expect(parseShowcaseCommandArgs(['--apply-production'])).toEqual({ applyProduction: true });
    expect(() => parseShowcaseCommandArgs(['--apply-production', '--apply-production'])).toThrow('no puede repetirse');
    expect(() => parseShowcaseCommandArgs(['--force'])).toThrow('Argumento desconocido');
  });
});
