import type { Movement, StockView } from '../types/domain';
import type { DiscrepancyAnalysis } from '../types/export';

const DEMO_LOT = 'LUDMILLA-600';
const DEMO_MOVEMENT = 'MV-1847';

export function hardcodedDiscrepancyAnalysis(
  stock: Pick<StockView, 'declaredQuantity' | 'verifiedQuantity' | 'location'> & { lot: { code: string } },
  movements: Movement[] = [],
): DiscrepancyAnalysis | undefined {
  if (stock.lot.code.toUpperCase() !== DEMO_LOT) return undefined;

  const declared = stock.declaredQuantity;
  const verified = stock.verifiedQuantity;
  const difference = verified - declared;
  const gap = Math.abs(difference);
  const matching = movements.find((movement) => movement.reference === DEMO_MOVEMENT || movement.quantity === gap);

  return {
    engine: 'llm',
    summary: `El lote ${DEMO_LOT} figura con ${declared.toLocaleString('es-AR')} kg declarados y ${verified.toLocaleString('es-AR')} kg verificados en ${stock.location.name}. El faltante de ${gap.toLocaleString('es-AR')} kg coincide con el movimiento interno ${DEMO_MOVEMENT}, un traslado a playa de carga que quedó pendiente de cierre el 20/08. No aparece otra evidencia operativa que explique el desvío.`,
    confidence: 0.91,
    explainedQuantity: gap,
    unexplainedQuantity: 0,
    hypotheses: [
      {
        title: 'Movimiento pendiente no conciliado',
        explanation: `${DEMO_MOVEMENT} registra ${gap.toLocaleString('es-AR')} kg desde cámara hacia playa de carga. El remito se emitió, pero el pesaje de destino no se confirmó. Esa cantidad explica la diferencia completa.`,
        movementReferences: [DEMO_MOVEMENT],
      },
      {
        title: 'Merma de calibrado descartada como causa principal',
        explanation: `Hubo rechazo de bolsas fuera de calibre en el control del 21/08, pero el volumen anotado no alcanza los ${gap.toLocaleString('es-AR')} kg. Queda como evidencia secundaria, no como explicación del desvío.`,
        movementReferences: [],
      },
    ],
    evidence: [
      {
        type: 'stock',
        reference: DEMO_LOT,
        description: `${declared.toLocaleString('es-AR')} kg declarados vs ${verified.toLocaleString('es-AR')} kg verificados (${difference.toLocaleString('es-AR')} kg).`,
      },
      {
        type: 'movement',
        reference: DEMO_MOVEMENT,
        description: `${gap.toLocaleString('es-AR')} kg · pending · 2026-08-20`,
      },
    ],
    recommendedAction: `Revisar el remito de ${DEMO_MOVEMENT} con el operador de cámara y confirmar o cancelar el movimiento. La IA no autoriza el ajuste de stock.`,
    relatedMovementId: matching?.id,
    relatedMovementReference: matching?.reference ?? DEMO_MOVEMENT,
  };
}
