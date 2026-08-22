import { describe, expect, it } from 'vitest';
import { validateDispatch } from './validateDispatch';

describe('validateDispatch', () => {
  it('bloquea A-204 mientras exista una discrepancia', () => {
    const result = validateDispatch({
      requestedQuantity: 5000,
      declaredQuantity: 25000,
      verifiedQuantity: 24000,
      hasUnresolvedDiscrepancy: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('UNRESOLVED_DISCREPANCY');
  });

  it('bloquea cantidades superiores al stock verificado', () => {
    const result = validateDispatch({
      requestedQuantity: 24500,
      declaredQuantity: 25000,
      verifiedQuantity: 24000,
      hasUnresolvedDiscrepancy: false,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('INSUFFICIENT_VERIFIED_STOCK');
  });

  it('habilita un despacho seguro', () => {
    expect(validateDispatch({
      requestedQuantity: 18000,
      declaredQuantity: 22000,
      verifiedQuantity: 22000,
      hasUnresolvedDiscrepancy: false,
    })).toEqual({ valid: true, errors: [] });
  });
});

