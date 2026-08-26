import type { PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { parseMigrationCommandArgs, runMigrationCommand } from './migrationCommand';

function fakeExecution() {
  const release = vi.fn();
  const connect = vi.fn(async () => ({ release } as unknown as PoolClient));
  const end = vi.fn(async () => undefined);
  const loadDatabase = vi.fn(async () => ({ connect, end }));
  const migrate = vi.fn(async () => ['004_correction_invariants.sql']);
  return { release, connect, end, loadDatabase, migrate };
}

describe('comando seguro de migraciones', () => {
  it('omite producción sin autorización antes de cargar o conectar la base', async () => {
    const execution = fakeExecution();
    const log = vi.fn();

    await expect(runMigrationCommand({
      args: [],
      nodeEnv: 'production',
      migrationsDirectory: 'migrations',
      log,
      loadDatabase: execution.loadDatabase,
      migrate: execution.migrate,
    })).resolves.toEqual({ skipped: true, applied: [] });

    expect(log).toHaveBeenCalledWith('Migraciones de producción omitidas: se requiere --apply-production.');
    expect(execution.loadDatabase).not.toHaveBeenCalled();
    expect(execution.connect).not.toHaveBeenCalled();
    expect(execution.migrate).not.toHaveBeenCalled();
  });

  it('aplica migraciones en Render aunque falte --apply-production', async () => {
    const execution = fakeExecution();
    const log = vi.fn();

    await expect(runMigrationCommand({
      args: [],
      nodeEnv: 'production',
      migrationsDirectory: 'migrations',
      log,
      render: true,
      loadDatabase: execution.loadDatabase,
      migrate: execution.migrate,
    })).resolves.toEqual({ skipped: false, applied: ['004_correction_invariants.sql'] });

    expect(execution.migrate).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith('Migraciones aplicadas: 004_correction_invariants.sql');
  });

  it('ejecuta normalmente en producción con --apply-production sin requerir auth', async () => {
    const execution = fakeExecution();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', 'postgresql://database.example/papastock');
    vi.stubEnv('PAPASTOCK_AUTH_USERNAME', '');
    vi.stubEnv('PAPASTOCK_AUTH_PASSWORD_HASH', '');
    vi.stubEnv('PAPASTOCK_SESSION_SECRET', '');
    try {
      await runMigrationCommand({
        args: ['--apply-production'],
        nodeEnv: process.env.NODE_ENV!,
        migrationsDirectory: 'migrations',
        loadDatabase: execution.loadDatabase,
        migrate: execution.migrate,
        log: vi.fn(),
      });
    } finally {
      vi.unstubAllEnvs();
    }

    expect(execution.connect).toHaveBeenCalledOnce();
    expect(execution.migrate).toHaveBeenCalledOnce();
    expect(execution.release).toHaveBeenCalledOnce();
    expect(execution.end).toHaveBeenCalledOnce();
  });

  it('combina autorización con --only sin alterar su selección', () => {
    expect(parseMigrationCommandArgs([
      '--apply-production', '--only', '004_correction_invariants.sql',
    ])).toEqual({
      applyProduction: true,
      selection: { only: '004_correction_invariants.sql' },
    });
  });

  it('combina autorización con --to sin alterar su selección', () => {
    expect(parseMigrationCommandArgs([
      '--to=006_stock_record_version.sql', '--apply-production',
    ])).toEqual({
      applyProduction: true,
      selection: { to: '006_stock_record_version.sql' },
    });
  });
});
