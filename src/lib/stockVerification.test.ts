import { describe, expect, it } from 'vitest';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { stockRecords } from '../data/stock';
import { getStockViews } from '../services/stockService';
import { buildStockVerificationPreview } from './stockVerification';

const records = getStockViews(stockRecords, lots, locations);

describe('buildStockVerificationPreview', () => {
  it('valida A-204 por sus datos reales, sin una excepción de demo', () => {
    const preview = buildStockVerificationPreview({
      stockRecordId: 'stock-a204',
      expectedVersion: 0,
      countedQuantity: 25000,
      date: '2026-08-22',
    }, records);
    expect(preview.valid).toBe(true);
    expect(preview).toMatchObject({ lotCode: 'A-204', countedQuantity: 25000 });
  });

  it('arma el preview con declarado, contado y diferencia', () => {
    const preview = buildStockVerificationPreview({
      stockRecordId: 'stock-b118',
      expectedVersion: 0,
      countedQuantity: 14400,
      date: '2026-08-22',
      bags: 288,
      notes: 'Conteo en piso',
    }, records);
    expect(preview).toMatchObject({
      valid: true,
      lotCode: 'B-118',
      declaredQuantity: 14500,
      countedQuantity: 14400,
      difference: -100,
    });
  });
});
