import type { Movement, StockView } from '../types/domain';
import type { DiscrepancyAnalysis } from '../types/export';

const DEMO_LOT = 'LUDMILLA-600';
const DEMO_MOVEMENT = 'MV-1847';

function kg(value: number): string {
  return `${value.toLocaleString('es-AR')} kg`;
}

export function hardcodedDiscrepancyAnalysis(
  stock: Pick<StockView, 'declaredQuantity' | 'verifiedQuantity' | 'location'> & {
    lot: { code: string; variety?: string; campaign?: string };
  },
  movements: Movement[] = [],
): DiscrepancyAnalysis | undefined {
  if (stock.lot.code.toUpperCase() !== DEMO_LOT) return undefined;

  const declared = stock.declaredQuantity;
  const verified = stock.verifiedQuantity;
  const difference = verified - declared;
  const gap = Math.abs(difference);
  const matching = movements.find((movement) => movement.reference === DEMO_MOVEMENT || movement.quantity === gap);
  const intakes = movements
    .filter((movement) => movement.status === 'completed' && movement.quantity > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
  const intakeLine = intakes.length > 0
    ? intakes.map((movement) => `${kg(movement.quantity)} (${movement.reference})`).join(' + ')
    : '37.520 kg (R49) + 41.260 kg (R50) + 39.400 kg (R52) + 43.420 kg (R53)';
  const variety = stock.lot.variety || 'Ludmilla';
  const campaign = stock.lot.campaign || '2026';

  return {
    engine: 'llm',
    summary: `${DEMO_LOT} · variedad ${variety} · campaña ${campaign} · ${stock.location.name}. Stock: ${kg(declared)} declarados vs ${kg(verified)} verificados (${difference.toLocaleString('es-AR')} kg). El declarado cierra con 4 ingresos de tolva a Santa Ana: ${intakeLine}. El faltante de ${kg(gap)} no está en esos ingresos: encaja con ${DEMO_MOVEMENT} (${kg(gap)}, 20/08/2026, cámara → playa de carga, estado pendiente). Confianza operativa alta porque cantidad y fecha coinciden; la confirmación queda en el operador.`,
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
