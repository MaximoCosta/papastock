import { describe, expect, it } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { buildAiOperationsContext } from './aiOperationsContext';
import { buildHeuristicOperationsAnswer } from './aiOperationsHeuristic';

const snapshot: PapaStockSnapshot = {
  locations: [{ id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' }],
  shelfUnits: [], shelves: [], transporters: [],
  lots: [{ id: 'lot-show-001', code: 'SHOW-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' }],
  stockRecords: [
    { id: 'stock-show', lotId: 'lot-show-001', locationId: 'loc-oriente', declaredQuantity: 8000, verifiedQuantity: 7900, unit: 'kg', updatedAt: '2026-08-24', verificationPending: true },
  ],
  movements: [{
    id: 'movement-pending', reference: 'MV-PEND', destinationLocationId: 'loc-oriente',
    date: '2026-08-24', status: 'pending', kind: 'transfer', receptionStatus: 'pending',
    items: [{ id: 'item-pending', movementId: 'movement-pending', lotId: 'lot-show-001', dispatchedQuantity: 500, unit: 'kg', sortOrder: 0 }],
  }],
  traceabilityEvents: [], discrepancies: [], stockCounts: [],
};

describe('heurística del asistente operativo', () => {
  it('lista verificaciones pendientes sin llamar a Groq', () => {
    const answer = buildHeuristicOperationsAnswer(
      buildAiOperationsContext('¿Qué lotes tienen verificación pendiente?', snapshot),
    );
    expect(answer.engine).toBe('heuristic');
    expect(answer.answer).toContain('SHOW-001');
    expect(answer.evidence[0]?.source).toBe('stock_records');
  });

  it('lista recepciones pendientes', () => {
    const answer = buildHeuristicOperationsAnswer(
      buildAiOperationsContext('¿Qué movimientos están pendientes de recepción?', snapshot),
    );
    expect(answer.engine).toBe('heuristic');
    expect(answer.answer).toContain('MV-PEND');
  });
});
