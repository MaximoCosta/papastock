import type { Movement, StockControlCorrection, StockView, TraceabilityEvent } from '../types/domain';
import type {
  DiscrepancyAnalysis,
  ExportValidationResult,
  ParsedTraceabilityEvent,
} from '../types/export';

export interface AIService {
  analyzeDiscrepancy(
    stock: StockView,
    movements: Movement[],
    traceability: TraceabilityEvent[],
  ): Promise<DiscrepancyAnalysis>;
  analyzeRequirements(validation: ExportValidationResult): Promise<{ summary: string }>;
  parseTraceabilityInput(input: string): Promise<ParsedTraceabilityEvent>;
  /** Mock OCR/visión: interpreta una foto de planilla de conteo marcada a mano. */
  parseStockControlSheet(file: File, scopeRecords: StockView[]): Promise<StockControlCorrection[]>;
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

/** Correcciones hardcodeadas para la demo (sin backend). */
function mockSheetCorrections(scopeRecords: StockView[]): StockControlCorrection[] {
  const preferredCodes = ['A-204', 'F-301', 'C-102'];
  const byCode = new Map(scopeRecords.map((record) => [record.lot.code, record]));
  const corrections: StockControlCorrection[] = [];

  for (const code of preferredCodes) {
    const record = byCode.get(code);
    if (!record) continue;

    if (code === 'A-204') {
      corrections.push({
        stockRecordId: record.id,
        lotCode: record.lot.code,
        previousVerified: record.verifiedQuantity,
        countedQuantity: 25000,
        notes: 'Conteo físico confirma declarado; diferencia explicada por MV-1032 pendiente.',
      });
    } else if (code === 'F-301') {
      corrections.push({
        stockRecordId: record.id,
        lotCode: record.lot.code,
        previousVerified: record.verifiedQuantity,
        countedQuantity: 16800,
        notes: 'Pendiente de verificación → contado en piso: 16.800 kg.',
      });
    } else if (code === 'C-102') {
      corrections.push({
        stockRecordId: record.id,
        lotCode: record.lot.code,
        previousVerified: record.verifiedQuantity,
        countedQuantity: 18500,
        notes: 'Ajuste a declarado tras recontar bolsa rota.',
      });
    }
  }

  if (corrections.length > 0) return corrections;

  return scopeRecords.slice(0, 2).map((record) => ({
    stockRecordId: record.id,
    lotCode: record.lot.code,
    previousVerified: record.verifiedQuantity,
    countedQuantity: record.declaredQuantity,
    notes: 'Marcado en planilla como OK (demo).',
  }));
}

const httpAIService: AIService = {
  async analyzeDiscrepancy(stock, lotMovements, traceability) {
    const response = await fetch('/api/ai/discrepancy', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        lot: { id: stock.lot.id, code: stock.lot.code },
        stock: {
          id: stock.id,
          lotId: stock.lotId,
          locationId: stock.locationId,
          declaredQuantity: stock.declaredQuantity,
          verifiedQuantity: stock.verifiedQuantity,
          updatedAt: stock.updatedAt,
          verificationPending: stock.verificationPending,
        },
        movements: lotMovements,
        traceability,
      }),
    });
    const payload = await response.json().catch(() => ({})) as { data?: DiscrepancyAnalysis; error?: string };
    if (!response.ok || !payload.data || !['llm', 'heuristic'].includes(payload.data.engine)) {
      throw new Error(payload.error ?? `El análisis no está disponible (HTTP ${response.status}).`);
    }
    return payload.data;
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

  // TODO backend: POST /api/ai/stock-sheet (multipart image + scope)
  async parseStockControlSheet(file, scopeRecords) {
    void file;
    await delay(1500);
    if (scopeRecords.length === 0) {
      throw new Error('No hay lotes en el alcance para interpretar la planilla.');
    }
    return mockSheetCorrections(scopeRecords);
  },
};

export const aiService: AIService = httpAIService;

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
