import { describe, expect, it } from 'vitest';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { stockRecords } from '../data/stock';
import { getOperationalMetrics, getStockViews } from '../services/stockService';
import { presentStockForOralDemo } from './demoStockPresentation';

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
