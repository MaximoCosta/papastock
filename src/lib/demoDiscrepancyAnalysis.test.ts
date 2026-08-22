import { describe, expect, it } from 'vitest';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { hardcodedDiscrepancyAnalysis } from './demoDiscrepancyAnalysis';

describe('hardcodedDiscrepancyAnalysis', () => {
  const location = locations[0]!;

  it('devuelve un análisis con motor IA sólo para LUDMILLA-600', () => {
    const analysis = hardcodedDiscrepancyAnalysis({
      lot: { code: 'LUDMILLA-600' },
      declaredQuantity: 161600,
      verifiedQuantity: 161250,
      location,
    });

    expect(analysis).toMatchObject({
      engine: 'llm',
      explainedQuantity: 350,
      unexplainedQuantity: 0,
      relatedMovementReference: 'MV-1847',
    });
    expect(analysis?.explainedQuantity + analysis!.unexplainedQuantity).toBe(350);
    expect(analysis?.recommendedAction).toMatch(/no autoriza/i);
  });

  it('no interviene en otros lotes', () => {
    expect(hardcodedDiscrepancyAnalysis({
      lot: { code: lots[0]!.code },
      declaredQuantity: 25000,
      verifiedQuantity: 24000,
      location,
    })).toBeUndefined();
  });
});
