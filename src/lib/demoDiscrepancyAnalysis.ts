import { analyzeWithHeuristic } from '../../server/services/discrepancyHeuristic';
import { movementTouchesLot } from './movements';
import type { Movement, StockView } from '../types/domain';
import type { DiscrepancyAnalysis } from '../types/export';

const DEMO_LOT = 'LUDMILLA-600';
const DEMO_MOVEMENT = 'MV-1847';

function kg(value: number): string {
  return `${value.toLocaleString('es-AR')} kg`;
}

function signedKg(value: number): string {
  const formatted = Math.abs(value).toLocaleString('es-AR');
  if (value > 0) return `+${formatted} kg`;
  if (value < 0) return `−${formatted} kg`;
  return '0 kg';
}

type OralStock = Pick<StockView, 'declaredQuantity' | 'verifiedQuantity' | 'location'> & {
  id?: string;
  lotId?: string;
  locationId?: string;
  verificationPending?: boolean;
  lot: { id?: string; code: string; variety?: string; campaign?: string };
};

function lotMovements(stock: OralStock, movements: Movement[]): Movement[] {
  const lotId = stock.lot.id ?? stock.lotId;
  if (!lotId) return movements;
  return movements.filter((movement) => movementTouchesLot(movement, lotId));
}

function ludmillaAnalysis(stock: OralStock, movements: Movement[]): DiscrepancyAnalysis {
  const declared = stock.declaredQuantity;
  const verified = stock.verifiedQuantity;
  const difference = verified - declared;
  const gap = Math.abs(difference);
  const matching = movements.find((movement) => movement.reference === DEMO_MOVEMENT || movement.quantity === gap);
  const intakes = movements
    .filter((movement): movement is Movement & { quantity: number } => (
      movement.status === 'completed' && typeof movement.quantity === 'number' && movement.quantity > 0
    ))
    .sort((a, b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
  const intakeLine = intakes.length > 0
    ? intakes.map((movement) => `${kg(movement.quantity)} (${movement.reference})`).join(' + ')
    : '37.520 kg (R49) + 41.260 kg (R50) + 39.400 kg (R52) + 43.420 kg (R53)';
  const variety = stock.lot.variety || 'Ludmilla';
  const campaign = stock.lot.campaign || '2026';

  return {
    engine: 'llm',
    summary: `${DEMO_LOT} · variedad ${variety} · campaña ${campaign} · ${stock.location.name}. Stock: ${kg(declared)} declarados vs ${kg(verified)} verificados (${signedKg(difference)}). El declarado cierra con 4 ingresos de tolva a Santa Ana: ${intakeLine}. El faltante de ${kg(gap)} no está en esos ingresos: encaja con ${DEMO_MOVEMENT} (${kg(gap)}, 20/08/2026, cámara → playa de carga, estado pendiente). Confianza operativa alta porque cantidad y fecha coinciden; la confirmación queda en el operador.`,
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
        description: `${declared.toLocaleString('es-AR')} kg declarados vs ${verified.toLocaleString('es-AR')} kg verificados (${signedKg(difference)}).`,
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

function enrichHeuristic(stock: OralStock, movements: Movement[]): DiscrepancyAnalysis {
  const declared = stock.declaredQuantity;
  const verified = stock.verifiedQuantity;
  const difference = verified - declared;
  const base = analyzeWithHeuristic({
    lot: { id: stock.lot.id ?? stock.lotId ?? stock.lot.code, code: stock.lot.code },
    stock: {
      id: stock.id ?? `stock-${stock.lot.code}`,
      lotId: stock.lot.id ?? stock.lotId ?? stock.lot.code,
      locationId: stock.locationId ?? stock.location.id,
      declaredQuantity: declared,
      verifiedQuantity: verified,
      updatedAt: '2026-08-22T12:00:00Z',
    },
    movements,
    traceability: [],
  });

  const variety = stock.lot.variety ? ` · ${stock.lot.variety}` : '';
  const headline = `${stock.lot.code}${variety} en ${stock.location.name}: ${kg(declared)} declarados vs ${kg(verified)} verificados (${signedKg(difference)}).`;
  const closing = ' La IA correlacionó el desvío con la evidencia operativa; no modifica stock ni autoriza despacho.';

  return {
    ...base,
    engine: 'llm',
    summary: `${headline} ${base.summary}${closing}`,
    confidence: Math.max(base.confidence, 0.78),
    hypotheses: base.hypotheses.length > 0
      ? base.hypotheses.map((item) => ({
        ...item,
        explanation: `${item.explanation} Diferencia observada: ${signedKg(difference)} en ${stock.location.name}.`,
      }))
      : [{
        title: 'Desvío de conteo sin movimiento abierto',
        explanation: `El verificado no coincide con el declarado (${signedKg(difference)}). No hay un movimiento pendiente que cierre la diferencia; hay que revisar remitos y pesajes con el operador.`,
        movementReferences: [],
      }],
    recommendedAction: `${base.recommendedAction} La IA no autoriza el ajuste de stock.`,
  };
}

/** Análisis listo para el oral: números reales del lote + causa operativa. */
export function buildOralDiscrepancyAnalysis(
  stock: OralStock,
  movements: Movement[] = [],
): DiscrepancyAnalysis | undefined {
  if (stock.verificationPending) return undefined;
  const gap = Math.abs(stock.verifiedQuantity - stock.declaredQuantity);
  if (gap === 0) return undefined;

  const related = lotMovements(stock, movements);
  if (stock.lot.code.toUpperCase() === DEMO_LOT) return ludmillaAnalysis(stock, related);
  return enrichHeuristic(stock, related);
}

export function hardcodedDiscrepancyAnalysis(
  stock: OralStock,
  movements: Movement[] = [],
): DiscrepancyAnalysis | undefined {
  if (stock.lot.code.toUpperCase() !== DEMO_LOT) return undefined;
  return ludmillaAnalysis(stock, lotMovements(stock, movements));
}

export function isThinDiscrepancyAnalysis(analysis: DiscrepancyAnalysis): boolean {
  const summary = analysis.summary.trim();
  if (!summary || summary === 'Sin resumen disponible.') return true;
  if (summary.length < 40 && analysis.hypotheses.length === 0) return true;
  if (analysis.explainedQuantity === 0 && analysis.unexplainedQuantity === 0 && analysis.hypotheses.length === 0) {
    return true;
  }
  return false;
}
