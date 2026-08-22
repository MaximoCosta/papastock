import type { Movement, StockRecord, TraceabilityEvent } from '../../src/types/domain';
import type { DiscrepancyAnalysis, DiscrepancyEvidence, DiscrepancyHypothesis } from '../../src/types/export';

export interface DiscrepancyInput {
  lot: { id: string; code: string };
  stock: StockRecord;
  movements: Movement[];
  traceability: TraceabilityEvent[];
}

const byRecent = (a: Movement, b: Movement) => b.date.localeCompare(a.date) || a.reference.localeCompare(b.reference);

function movementEvidence(movements: Movement[]): DiscrepancyEvidence[] {
  return movements.map((movement) => ({
    type: 'movement',
    reference: movement.reference,
    description: `${movement.quantity.toLocaleString('es-AR')} kg · ${movement.status} · ${movement.date}`,
  }));
}

function hypothesis(title: string, explanation: string, movements: Movement[]): DiscrepancyHypothesis {
  return { title, explanation, movementReferences: movements.map((item) => item.reference) };
}

export function analyzeWithHeuristic(input: DiscrepancyInput): DiscrepancyAnalysis {
  const difference = input.stock.verifiedQuantity - input.stock.declaredQuantity;
  const target = Math.abs(difference);
  if (target === 0) {
    return {
      engine: 'heuristic',
      summary: 'El stock declarado coincide con el verificado; no hay discrepancia que explicar.',
      confidence: 1,
      explainedQuantity: 0,
      unexplainedQuantity: 0,
      hypotheses: [],
      evidence: [{ type: 'stock', reference: input.lot.code, description: 'Diferencia verificada: 0 kg.' }],
      recommendedAction: 'Mantener el control operativo normal; no se requiere conciliación.',
    };
  }

  const pending = input.movements
    .filter((movement) => movement.status === 'pending')
    .filter((movement) => movement.originLocationId === input.stock.locationId || movement.destinationLocationId === input.stock.locationId)
    .sort(byRecent);

  const exact = pending.find((movement) => movement.quantity === target);
  if (exact) {
    return {
      engine: 'heuristic',
      summary: `El movimiento pendiente ${exact.reference} coincide exactamente con la diferencia de ${target.toLocaleString('es-AR')} kg.`,
      confidence: 0.95,
      explainedQuantity: target,
      unexplainedQuantity: 0,
      hypotheses: [hypothesis('Movimiento pendiente no conciliado', 'La cantidad y la ubicación coinciden exactamente con el desvío de stock.', [exact])],
      evidence: movementEvidence([exact]),
      recommendedAction: `Revisar el remito y confirmar o cancelar ${exact.reference}; la decisión final corresponde al operador.`,
      relatedMovementId: exact.id,
      relatedMovementReference: exact.reference,
    };
  }

  for (let left = 0; left < pending.length; left += 1) {
    for (let right = left + 1; right < pending.length; right += 1) {
      if (pending[left].quantity + pending[right].quantity === target) {
        const matches = [pending[left], pending[right]];
        return {
          engine: 'heuristic',
          summary: `Dos movimientos pendientes (${matches.map((item) => item.reference).join(' + ')}) suman exactamente ${target.toLocaleString('es-AR')} kg.`,
          confidence: 0.88,
          explainedQuantity: target,
          unexplainedQuantity: 0,
          hypotheses: [hypothesis('Combinación de movimientos sin conciliar', 'La suma de los movimientos coincide con la diferencia registrada.', matches)],
          evidence: movementEvidence(matches),
          recommendedAction: 'Contrastar ambos remitos y pesajes antes de conciliar el stock.',
          relatedMovementId: matches[0].id,
          relatedMovementReference: matches.map((item) => item.reference).join(' + '),
        };
      }
    }
  }

  const partial = pending.filter((movement) => movement.quantity < target).slice(0, 4);
  const explained = Math.min(target, partial.reduce((sum, movement) => sum + movement.quantity, 0));
  if (partial.length && explained > 0) {
    return {
      engine: 'heuristic',
      summary: `Movimientos pendientes recientes explican ${explained.toLocaleString('es-AR')} de ${target.toLocaleString('es-AR')} kg.`,
      confidence: 0.62,
      explainedQuantity: explained,
      unexplainedQuantity: target - explained,
      hypotheses: [hypothesis('Conciliación parcial pendiente', 'Hay evidencia operativa relacionada, pero no alcanza para explicar todo el desvío.', partial)],
      evidence: movementEvidence(partial),
      recommendedAction: 'Revisar estos movimientos y buscar pesajes o remitos adicionales para la cantidad restante.',
      relatedMovementId: partial[0].id,
      relatedMovementReference: partial.map((item) => item.reference).join(' + '),
    };
  }

  return {
    engine: 'heuristic',
    summary: `No hay movimientos pendientes relacionados que expliquen la diferencia de ${target.toLocaleString('es-AR')} kg.`,
    confidence: 0.25,
    explainedQuantity: 0,
    unexplainedQuantity: target,
    hypotheses: [hypothesis('Evidencia operativa insuficiente', 'El historial disponible no permite asociar la diferencia a un movimiento abierto.', [])],
    evidence: [{ type: 'stock', reference: input.lot.code, description: `Diferencia sin explicar: ${target.toLocaleString('es-AR')} kg.` }],
    recommendedAction: 'Revisar remitos, pesajes y verificaciones recientes; no conciliar automáticamente.',
  };
}
