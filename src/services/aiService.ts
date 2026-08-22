import type { Location, Movement, StockView, TraceabilityEvent } from '../types/domain';
import type {
  DiscrepancyAnalysis,
  ExportValidationResult,
  ParsedTraceabilityEvent,
} from '../types/export';

export interface AIService {
  analyzeDiscrepancy(
    stock: StockView,
    movements: Movement[],
    locations: Location[],
  ): Promise<DiscrepancyAnalysis>;
  analyzeRequirements(validation: ExportValidationResult): Promise<{ summary: string }>;
  parseTraceabilityInput(input: string): Promise<ParsedTraceabilityEvent>;
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const monthNumbers: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

function parseDate(input: string): string {
  const isoMatch = input.match(/(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const spanishMatch = input.toLowerCase().match(/([0-3]?\d)\s+de\s+([a-záéíóú]+)(?:\s+de\s+(20\d{2}))?/);
  if (spanishMatch) {
    const month = monthNumbers[spanishMatch[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    if (month) {
      return `${spanishMatch[3] ?? '2026'}-${month}-${spanishMatch[1].padStart(2, '0')}`;
    }
  }

  return '2026-08-18';
}

function parseProduct(input: string): string {
  const productMatch = input.match(/(?:con|producto)\s+([\p{L}\d][\p{L}\d .-]*?)(?:\s+el\s+|\s+en\s+fecha|[,.]|$)/iu);
  return productMatch?.[1]?.trim() || 'Producto informado';
}

const mockAIService: AIService = {
  async analyzeDiscrepancy(stock, lotMovements, allLocations) {
    await delay(520);
    const matchingMovement = lotMovements.find(
      (movement) => movement.status === 'pending'
        && movement.destinationLocationId === stock.locationId
        && movement.quantity === Math.abs(stock.difference),
    );

    if (!matchingMovement) {
      return {
        cause: 'No se encontró un movimiento abierto que explique exactamente la diferencia. Revisar remitos y pesajes recientes.',
        confidence: 'low',
      };
    }

    const origin = allLocations.find((location) => location.id === matchingMovement.originLocationId);
    const destination = allLocations.find((location) => location.id === matchingMovement.destinationLocationId);
    return {
      cause: `Existe un movimiento pendiente de ${matchingMovement.quantity.toLocaleString('es-AR')} kg desde ${origin?.name ?? 'origen no informado'} hacia ${destination?.name ?? 'destino no informado'} que coincide con la diferencia detectada.`,
      relatedMovementId: matchingMovement.id,
      relatedMovementReference: matchingMovement.reference,
      confidence: 'high',
    };
  },

  async analyzeRequirements(validation) {
    await delay(320);
    return {
      summary: validation.valid
        ? 'Todos los requisitos documentales tienen respaldo en los datos del lote.'
        : `${validation.missingFields.length} requisito(s) necesitan información adicional.`,
    };
  },

  async parseTraceabilityInput(input) {
    await delay(480);
    return {
      type: 'treatment',
      date: parseDate(input),
      product: parseProduct(input),
      sourceText: input.trim(),
    };
  },
};

// Único punto de sustitución: cambiar esta asignación por un cliente HTTP
// hacia una Edge Function o API segura. Los componentes consumen AIService.
export const aiService: AIService = mockAIService;

export function toTraceabilityEvent(
  parsed: ParsedTraceabilityEvent,
  lotId: string,
): TraceabilityEvent {
  return {
    id: `trace-${lotId}-${parsed.type}-${Date.now()}`,
    lotId,
    type: parsed.type,
    date: parsed.date,
    data: { product: parsed.product, sourceText: parsed.sourceText, origin: 'operator_confirmation' },
  };
}
