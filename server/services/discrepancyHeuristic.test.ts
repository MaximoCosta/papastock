import { describe, expect, it } from 'vitest';
import { locations } from '../../src/data/locations';
import { lots } from '../../src/data/lots';
import { movements as demoMovements } from '../../src/data/movements';
import { stockRecords } from '../../src/data/stock';
import { movementTouchesLot } from '../../src/lib/movements';
import { getStockViews } from '../../src/services/stockService';
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

  it('cubre las seis discrepancias de demo con evidencia distinta', () => {
    const views = getStockViews(stockRecords, lots, locations);
    const analyze = (code: string) => {
      const lot = lots.find((item) => item.code === code)!;
      const stock = views.find((view) => view.lotId === lot.id)!;
      return analyzeWithHeuristic({
        lot: { id: lot.id, code: lot.code },
        stock,
        movements: demoMovements.filter((movement) => movementTouchesLot(movement, lot.id)),
        traceability: [],
      });
    };

    expect(analyze('A-204')).toMatchObject({ relatedMovementReference: 'MV-1032', explainedQuantity: 1000, unexplainedQuantity: 0 });
    expect(analyze('B-221')).toMatchObject({ relatedMovementReference: 'MV-1051', explainedQuantity: 800, unexplainedQuantity: 0 });
    expect(analyze('D-405')).toMatchObject({ relatedMovementReference: 'MV-1053 + MV-1052', explainedQuantity: 800, unexplainedQuantity: 0 });
    expect(analyze('E-090')).toMatchObject({ relatedMovementReference: 'MV-1054', explainedQuantity: 350, unexplainedQuantity: 850 });
    expect(analyze('C-102')).toMatchObject({ explainedQuantity: 0, unexplainedQuantity: 500 });
    expect(analyze('G-512')).toMatchObject({ explainedQuantity: 0, unexplainedQuantity: 1200 });
  });
});
