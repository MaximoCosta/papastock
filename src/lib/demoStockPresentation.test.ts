import { describe, expect, it } from 'vitest';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { stockRecords } from '../data/stock';
import { getOperationalMetrics, getStockViews } from '../services/stockService';
import type { Movement, TraceabilityEvent } from '../types/domain';
import { presentStockForOralDemo, projectOralDemoSnapshot } from './demoStockPresentation';

describe('presentStockForOralDemo', () => {
  it('deja la mayoría verificada y exactamente 6 discrepancias, conservando A-204', () => {
    const presented = presentStockForOralDemo(stockRecords, lots);
    const views = getStockViews(presented, lots, locations);
    const a204 = views.find((record) => record.lot.code === 'A-204');
    const pending = views.filter((record) => record.status === 'pending');
    const discrepancies = views.filter((record) => record.status === 'discrepancy');

    expect(a204).toMatchObject({ declaredQuantity: 25000, verifiedQuantity: 24000, status: 'discrepancy' });
    expect(pending).toHaveLength(0);
    expect(discrepancies).toHaveLength(6);
    expect(getOperationalMetrics(views).discrepancies).toBe(6);
    expect(getOperationalMetrics(views).totalStock).toBeGreaterThan(0);
  });

  it('muestra stock operativo aunque el backend deje todo pendiente y verified en null', () => {
    const raw = stockRecords.map((record) => ({
      ...record,
      verifiedQuantity: 0,
      verificationPending: true,
    }));
    const presented = presentStockForOralDemo(raw, lots);
    const views = getStockViews(presented, lots, locations);

    expect(views.every((record) => record.status !== 'pending')).toBe(true);
    expect(getOperationalMetrics(views).totalStock).toBeGreaterThan(100_000);
    expect(getOperationalMetrics(getStockViews(raw, lots, locations)).totalStock).toBeGreaterThan(100_000);
  });
});

describe('projectOralDemoSnapshot', () => {
  it('marca las 6 discrepancias de demo y agrega los movimientos pendientes', () => {
    const projected = projectOralDemoSnapshot({
      lots,
      stockRecords: stockRecords.map((record) => ({ ...record })),
      movements: [] as Movement[],
      traceabilityEvents: [] as TraceabilityEvent[],
    });
    const views = getStockViews(projected.stockRecords, lots, locations);
    expect(views.filter((record) => record.status === 'discrepancy')).toHaveLength(6);
    expect(projected.movements.map((movement) => movement.reference)).toEqual(
      expect.arrayContaining(['MV-1032', 'MV-1051', 'MV-1052', 'MV-1053', 'MV-1054']),
    );
  });

  it('arma 6 discrepancias sobre lotes importados cuando no están A-204 ni el resto de la demo', () => {
    const importedLots = Array.from({ length: 8 }, (_, index) => ({
      id: `lot-imp-${index}`,
      code: index === 0 ? 'LUDMILLA-600' : `IMP-${index}`,
      variety: 'Spunta',
      campaign: '2026',
      producer: 'Papasud',
      origin: 'Balcarce',
    }));
    const importedStock = importedLots.map((lot, index) => ({
      id: `stock-imp-${index}`,
      lotId: lot.id,
      locationId: 'loc-santa',
      declaredQuantity: 20_000 - index * 500,
      verifiedQuantity: 0,
      verificationPending: true,
      updatedAt: '2026-08-23T12:00:00Z',
    }));
    const importedLocations = [{ id: 'loc-santa', name: 'Santa Ana', type: 'cold_storage' as const }];
    const projected = projectOralDemoSnapshot({
      lots: importedLots,
      stockRecords: importedStock,
      movements: [] as Movement[],
      traceabilityEvents: [] as TraceabilityEvent[],
    });
    const views = getStockViews(projected.stockRecords, importedLots, importedLocations);
    const discrepancies = views.filter((record) => record.status === 'discrepancy');

    expect(discrepancies).toHaveLength(6);
    expect(discrepancies.some((record) => record.lot.code === 'LUDMILLA-600')).toBe(true);
    expect(views.every((record) => record.status !== 'pending')).toBe(true);
    expect(projected.movements.length).toBeGreaterThan(0);
    expect(projected.movements.every((movement) => movement.reference.startsWith('ORAL-'))).toBe(true);
  });
});
