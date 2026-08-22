import { describe, expect, it } from 'vitest';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { stockRecords } from '../data/stock';
import { getStockViews } from '../services/stockService';
import { buildStockVerificationPreview } from './stockVerification';

const records = getStockViews(stockRecords, lots, locations);

describe('buildStockVerificationPreview', () => {
  it('bloquea la verificación de A-204', () => {
    const preview = buildStockVerificationPreview({
      stockRecordId: 'stock-a204',
      countedQuantity: 25000,
      date: '2026-08-22',
    }, records);
    expect(preview.valid).toBe(false);
    expect(preview.issues.some((item) => item.code === 'PROTECTED_DEMO_LOT')).toBe(true);
  });

  it('arma el preview con declarado, contado y diferencia', () => {
    const preview = buildStockVerificationPreview({
      stockRecordId: 'stock-b118',
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
