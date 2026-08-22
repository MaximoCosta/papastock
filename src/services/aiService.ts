import type { Movement, StockControlCorrection, StockView, TraceabilityEvent } from '../types/domain';
import type {
  AiExportRequirementsResult,
  ConfirmedTraceabilityEvent,
  DiscrepancyAnalysis,
  ExportValidationResult,
  ParsedTraceabilityEvent,
  TraceabilityIntent,
} from '../types/export';
import { apiUrl, normalizeDiscrepancyAnalysis, readApiData } from './apiClient';

export interface AIService {
  analyzeDiscrepancy(
    stock: StockView,
    movements: Movement[],
    traceability: TraceabilityEvent[],
  ): Promise<DiscrepancyAnalysis>;
  analyzeRequirements(validation: ExportValidationResult): Promise<{ summary: string }>;
  parseTraceabilityInput(input: string, lotId: string): Promise<ParsedTraceabilityEvent>;
  analyzeExportRequirements(
    country: string,
    documentType: string,
    sourceText: string,
  ): Promise<AiExportRequirementsResult>;
  /** Mock OCR/visión: interpreta una foto de planilla de conteo marcada a mano. */
  parseStockControlSheet(file: File, scopeRecords: StockView[]): Promise<StockControlCorrection[]>;
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const monthNumbers: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

/** Último recurso si el endpoint no responde. Devuelve null antes que inventar un dato. */
function parseDate(input: string): string | null {
  const isoMatch = input.match(/(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const spanishMatch = input.toLowerCase().match(/([0-3]?\d)\s+de\s+([a-záéíóú]+)(?:\s+de\s+(20\d{2}))?/);
  if (spanishMatch) {
    const month = monthNumbers[spanishMatch[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    if (month) {
      const year = spanishMatch[3] ?? String(new Date().getUTCFullYear());
      return `${year}-${month}-${spanishMatch[1].padStart(2, '0')}`;
    }
  }

  return null;
}

function parseProduct(input: string): string | null {
  const productMatch = input.match(/(?:con|producto)\s+([\p{L}\d][\p{L}\d .-]*?)(?:\s+el\s+|\s+en\s+fecha|[,.]|$)/iu);
  return productMatch?.[1]?.trim() || null;
}

function localTraceabilityFallback(input: string): ParsedTraceabilityEvent {
  const product = parseProduct(input);
  const date = parseDate(input);
  const found = Number(Boolean(product)) + Number(Boolean(date));
  return {
    type: 'treatment',
    product,
    date,
    sourceText: input.trim(),
    engine: 'heuristic',
    confidence: found === 2 ? 0.5 : found === 1 ? 0.35 : 0.15,
  };
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
    const response = await fetch(apiUrl('/api/ai/discrepancy'), {
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
    const payload = normalizeDiscrepancyAnalysis(await readApiData(response, 'El análisis no está disponible.'));
    if (!['llm', 'heuristic'].includes(payload.engine)) {
      throw new Error('El análisis no está disponible.');
    }
    return payload;
  },

  async analyzeRequirements(validation) {
    await delay(320);
    return {
      summary: validation.valid
        ? 'Todos los requisitos documentales tienen respaldo en los datos del lote.'
        : `${validation.missingFields.length} requisito(s) necesitan información adicional.`,
    };
  },

  async parseTraceabilityInput(input, lotId) {
    const text = input.trim();
    try {
      const response = await fetch('/api/ai/traceability-intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ text, lotId }),
      });
      const payload = await response.json().catch(() => ({})) as { data?: TraceabilityIntent };
      const data = payload.data;
      if (!response.ok || !data || !['llm', 'heuristic'].includes(data.engine)) {
        throw new Error('Interpretación no disponible.');
      }
      return {
        type: 'treatment',
        product: data.product,
        date: data.date,
        sourceText: text,
        engine: data.engine,
        confidence: data.confidence,
      };
    } catch {
      // El endpoint ya cae solo a heurística server-side; esto cubre red caída.
      return localTraceabilityFallback(text);
    }
  },

  async analyzeExportRequirements(country, documentType, sourceText) {
    const response = await fetch('/api/ai/export-requirements', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ country, documentType, sourceText }),
    });
    const payload = await response.json().catch(() => ({})) as {
      data?: AiExportRequirementsResult;
      error?: string;
    };
    if (!response.ok || !payload.data || !['llm', 'heuristic'].includes(payload.data.engine)) {
      throw new Error(payload.error ?? `La interpretación de requisitos no está disponible (HTTP ${response.status}).`);
    }
    return payload.data;
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
  confirmed: ConfirmedTraceabilityEvent,
  lotId: string,
): TraceabilityEvent {
  return {
    id: `trace-${lotId}-${confirmed.type}-${Date.now()}`,
    lotId,
    type: confirmed.type,
    date: confirmed.date,
    data: {
      product: confirmed.product,
      sourceText: confirmed.sourceText,
      origin: 'operator_confirmation',
    },
  };
}
