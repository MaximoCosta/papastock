import { describe, expect, it } from 'vitest';
import { locations } from '../data/locations';
import { lots } from '../data/lots';
import { movements } from '../data/movements';
import { buildOralDiscrepancyAnalysis, hardcodedDiscrepancyAnalysis } from './demoDiscrepancyAnalysis';

describe('hardcodedDiscrepancyAnalysis', () => {
  const location = locations[0]!;

  it('devuelve un análisis con motor IA sólo para LUDMILLA-600', () => {
    const analysis = hardcodedDiscrepancyAnalysis({
      lot: { code: 'LUDMILLA-600', variety: 'Ludmilla', campaign: '2026' },
      declaredQuantity: 161600,
      verifiedQuantity: 161250,
      location: { ...location, name: 'Santa Ana' },
    });

    expect(analysis).toMatchObject({
      engine: 'llm',
      explainedQuantity: 350,
      unexplainedQuantity: 0,
      relatedMovementReference: 'MV-1847',
    });
    expect(analysis?.summary).toMatch(/Ludmilla/);
    expect(analysis?.summary).toMatch(/161/);
    expect(analysis?.summary).toMatch(/Santa Ana/);
    expect(analysis?.summary).toMatch(/MV-1847/);
    expect((analysis?.explainedQuantity ?? 0) + (analysis?.unexplainedQuantity ?? 0)).toBe(350);
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

describe('buildOralDiscrepancyAnalysis', () => {
  const south = { id: 'loc-south', name: 'Frigorífico Sur', type: 'cold_storage' as const };

  it('explica A-204 con MV-1032 y los kilos de la diferencia', () => {
    const a204 = lots.find((lot) => lot.code === 'A-204')!;
    const analysis = buildOralDiscrepancyAnalysis({
      lot: a204,
      lotId: a204.id,
      locationId: 'loc-south',
      declaredQuantity: 25000,
      verifiedQuantity: 24000,
      location: south,
    }, movements);

    expect(analysis).toMatchObject({
      engine: 'llm',
      relatedMovementReference: 'MV-1032',
      explainedQuantity: 1000,
      unexplainedQuantity: 0,
    });
    expect(analysis?.summary).toMatch(/A-204/);
    expect(analysis?.summary).toMatch(/25\.000|25000/);
    expect(analysis?.summary).toMatch(/24\.000|24000/);
    expect(analysis?.summary).toMatch(/MV-1032/);
    expect(analysis?.hypotheses[0]?.explanation.length).toBeGreaterThan(40);
    expect(analysis?.recommendedAction).toMatch(/no autoriza/i);
  });

  it('no inventa un análisis si no hay diferencia', () => {
    expect(buildOralDiscrepancyAnalysis({
      lot: { code: 'H-118', id: 'lot-h118' },
      lotId: 'lot-h118',
      declaredQuantity: 13500,
      verifiedQuantity: 13500,
      location: south,
    })).toBeUndefined();
  });
});
