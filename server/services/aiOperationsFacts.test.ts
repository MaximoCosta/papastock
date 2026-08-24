import { describe, expect, it } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { buildAiOperationsContext } from './aiOperationsContext';
import { buildLotStockFacts } from './aiOperationsFacts';

const snapshot: PapaStockSnapshot = {
  locations: [
    { id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' },
    { id: 'loc-frig-a', name: 'Frigorífico A', type: 'cold_storage' },
  ],
  shelfUnits: [], shelves: [], transporters: [],
  lots: [{
    id: 'lot-show-001', code: 'SHOW-001', variety: 'Spunta', campaign: '2025/26',
    producer: 'Papasud', origin: 'Balcarce',
  }],
  stockRecords: [
    {
      id: 'stock-show-001-oriente', lotId: 'lot-show-001', locationId: 'loc-oriente',
      declaredQuantity: 8_000, verifiedQuantity: 7_900, verificationPending: false,
      unit: 'kg', updatedAt: '2026-08-24',
    },
    {
      id: 'stock-show-001-frig', lotId: 'lot-show-001', locationId: 'loc-frig-a',
      declaredQuantity: 2_250, verifiedQuantity: 2_250, verificationPending: false,
      unit: 'kg', updatedAt: '2026-08-24',
    },
    {
      id: 'stock-show-001-bags', lotId: 'lot-show-001', locationId: 'loc-oriente',
      declaredQuantity: 30, verifiedQuantity: 28, verificationPending: true,
      unit: 'bags', updatedAt: '2026-08-24',
    },
  ],
  movements: [], traceabilityEvents: [], discrepancies: [], stockCounts: [],
};

describe('hechos canónicos del stock para IA', () => {
  it('agrupa por lote y unidad sin combinar kg con bolsas', () => {
    const context = buildAiOperationsContext(
      '¿Cuánto stock hay de SHOW-001?', snapshot, '2026-08-24T12:00:00.000Z',
    );
    const facts = buildLotStockFacts(context);

    expect(facts).toHaveLength(2);
    expect(facts.find((fact) => fact.unit === 'kg')).toEqual({
      lotId: 'lot-show-001',
      lotCode: 'SHOW-001',
      unit: 'kg',
      totalDeclared: 10_250,
      totalVerified: 10_150,
      difference: -100,
      verificationPendingCount: 0,
      locations: [
        {
          locationId: 'loc-oriente', locationName: 'Campo Oriente',
          declaredQuantity: 8_000, verifiedQuantity: 7_900, verificationPending: false,
        },
        {
          locationId: 'loc-frig-a', locationName: 'Frigorífico A',
          declaredQuantity: 2_250, verifiedQuantity: 2_250, verificationPending: false,
        },
      ],
    });
    expect(facts.find((fact) => fact.unit === 'bags')).toMatchObject({
      totalDeclared: 30,
      totalVerified: 28,
      difference: -2,
      verificationPendingCount: 1,
    });
  });

  it('no depende de texto generado por Groq', () => {
    const context = buildAiOperationsContext('Stock de SHOW-001', snapshot);
    expect(buildLotStockFacts(context).map((fact) => [fact.unit, fact.totalDeclared])).toEqual([
      ['bags', 30],
      ['kg', 10_250],
    ]);
  });
});
