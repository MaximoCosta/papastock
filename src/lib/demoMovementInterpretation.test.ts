import { describe, expect, it } from 'vitest';
import {
  DEMO_MOVEMENT_EXAMPLE,
  demoMovementInterpretation,
  demoMovementPreview,
  isDemoMovementOrder,
} from './demoMovementInterpretation';

describe('demoMovementInterpretation', () => {
  it('reconoce el ejemplo seguro de A-310', () => {
    expect(isDemoMovementOrder(DEMO_MOVEMENT_EXAMPLE)).toBe(true);
    expect(isDemoMovementOrder('move 500 kg lote a-310 frigorifico central galpon principal')).toBe(true);
    expect(isDemoMovementOrder('Mové 1000 kg del lote LUDMILLA-600')).toBe(false);
  });

  it('arma interpretación y preview válidos para la oral', () => {
    expect(demoMovementInterpretation()).toMatchObject({
      engine: 'llm',
      lotCode: 'A-310',
      quantityKg: 500,
      origin: 'Frigorífico Central',
      destination: 'Galpón Principal',
    });
    expect(demoMovementPreview()).toMatchObject({
      valid: true,
      lot: { code: 'A-310', variety: 'Innovator' },
      originStock: { verifiedQuantity: 22000 },
    });
  });
});
