import { describe, expect, it } from 'vitest';
import type { Movement } from '../../src/types/domain';
import { analyzeWithHeuristic, type DiscrepancyInput } from './discrepancyHeuristic';

const movement = (reference: string, quantity: number, status: Movement['status'] = 'pending', date = '2026-08-20'): Movement => ({
  id: reference.toLowerCase(), reference, quantity, status, date,
  lotId: 'lot-a204', originLocationId: 'loc-north', destinationLocationId: 'loc-south',
});

const input = (difference: number, movements: Movement[]): DiscrepancyInput => ({
  lot: { id: 'lot-a204', code: 'A-204' },
  stock: {
    id: 'stock-a204', lotId: 'lot-a204', locationId: 'loc-south',
    declaredQuantity: 25_000, verifiedQuantity: 25_000 + difference, updatedAt: '2026-08-21',
  },
  movements,
  traceability: [],
});

describe('heurística canónica de discrepancias', () => {
  it('resuelve diferencia cero sin buscar movimientos', () => {
    expect(analyzeWithHeuristic(input(0, [movement('MV-X', 1000)]))).toMatchObject({ explainedQuantity: 0, unexplainedQuantity: 0, confidence: 1 });
  });

  it('relaciona el movimiento exacto de A-204', () => {
    expect(analyzeWithHeuristic(input(-1000, [movement('MV-1032', 1000)]))).toMatchObject({
      engine: 'heuristic', relatedMovementReference: 'MV-1032', explainedQuantity: 1000, unexplainedQuantity: 0,
    });
  });

  it('combina dos movimientos cuya suma coincide', () => {
    expect(analyzeWithHeuristic(input(-1100, [movement('MV-1', 800), movement('MV-2', 300)]))).toMatchObject({
      relatedMovementReference: 'MV-1 + MV-2', explainedQuantity: 1100, unexplainedQuantity: 0,
    });
  });

  it('explica parcialmente y conserva el remanente', () => {
    expect(analyzeWithHeuristic(input(-1300, [movement('MV-1', 800), movement('MV-2', 300, 'completed')]))).toMatchObject({
      explainedQuantity: 800, unexplainedQuantity: 500,
    });
  });

  it('no inventa evidencia cuando no existe', () => {
    const result = analyzeWithHeuristic(input(-700, [movement('MV-C', 700, 'cancelled')]));
    expect(result).toMatchObject({ explainedQuantity: 0, unexplainedQuantity: 700 });
    expect(result).not.toHaveProperty('relatedMovementReference');
    expect(result.hypotheses[0].movementReferences).toEqual([]);
  });
});
