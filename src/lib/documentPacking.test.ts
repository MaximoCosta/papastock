import { describe, expect, it } from 'vitest';
import { addUtcDays, derivePacking, shippingMarks } from './documentPacking';

describe('derivePacking', () => {
  it('parte 18.000 kg en 720 bultos homogéneos de 25 kg', () => {
    const packing = derivePacking(18000, 25);
    expect(packing).toMatchObject({
      bagCount: 720,
      bagWeightKg: 25,
      netWeightKg: 18000,
      lastBagKg: 25,
      homogeneous: true,
    });
    expect(packing.tareKg).toBe(108);
    expect(packing.grossWeightKg).toBe(18108);
  });

  it('deja el remanente en el último bulto cuando no divide exacto', () => {
    const packing = derivePacking(13010, 25);
    expect(packing.bagCount).toBe(521);
    expect(packing.lastBagKg).toBe(10);
    expect(packing.homogeneous).toBe(false);
  });
});

describe('shippingMarks', () => {
  it('arma la marca de embarque con lote y destino', () => {
    expect(shippingMarks('A-310', 'Brasil')).toBe('PAPASUD / A-310 / BRASIL');
  });
});

describe('addUtcDays', () => {
  it('calcula la vigencia en UTC sin correr el día por zona horaria', () => {
    expect(addUtcDays('2026-08-28', 15)).toBe('2026-09-12');
  });
});
