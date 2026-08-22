import { z } from 'zod';
import type { DiscrepancyAnalysis } from '../../src/types/export';
import { analyzeWithHeuristic, type DiscrepancyInput } from './discrepancyHeuristic';

const analysisSchema = z.object({
  summary: z.string().min(1).max(700),
  confidence: z.number().min(0).max(1),
  explainedQuantity: z.number().min(0),
  unexplainedQuantity: z.number().min(0),
  hypotheses: z.array(z.object({
    title: z.string().min(1).max(160),
    explanation: z.string().min(1).max(700),
    movementReferences: z.array(z.string()).max(8),
  })).max(5),
  evidence: z.array(z.object({
    type: z.enum(['movement', 'traceability', 'stock']),
    reference: z.string().min(1).max(160),
    description: z.string().min(1).max(500),
  })).max(10),
  recommendedAction: z.string().min(1).max(700),
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'confidence', 'explainedQuantity', 'unexplainedQuantity', 'hypotheses', 'evidence', 'recommendedAction'],
  properties: {
    summary: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    explainedQuantity: { type: 'number', minimum: 0 },
    unexplainedQuantity: { type: 'number', minimum: 0 },
    hypotheses: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'explanation', 'movementReferences'],
        properties: {
          title: { type: 'string' },
          explanation: { type: 'string' },
          movementReferences: { type: 'array', items: { type: 'string' }, maxItems: 8 },
        },
      },
    },
    evidence: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'reference', 'description'],
        properties: {
          type: { type: 'string', enum: ['movement', 'traceability', 'stock'] },
          reference: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    recommendedAction: { type: 'string' },
  },
} as const;

interface AnalyzerOptions {
  apiKey?: string;
  model: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export function createDiscrepancyAnalyzer(options: AnalyzerOptions) {
  return async function analyze(input: DiscrepancyInput): Promise<DiscrepancyAnalysis> {
    const target = Math.abs(input.stock.verifiedQuantity - input.stock.declaredQuantity);
    if (!options.apiKey || target === 0) return analyzeWithHeuristic(input);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await (options.fetchImpl ?? fetch)('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { authorization: `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: [
                'Sos un analista de conciliación de stock agrícola.',
                'Analizá únicamente la evidencia JSON entregada; nunca inventes movimientos, referencias ni cantidades.',
                'Una hipótesis es informativa: no autoriza despachos, conciliaciones ni escrituras.',
                'Priorizá movimientos pendientes y recientes vinculados a la ubicación del stock.',
                'Las cantidades explicada y no explicada deben sumar exactamente la diferencia absoluta.',
                'La acción recomendada siempre requiere revisión humana.',
                'Respondé en español y exclusivamente con el JSON Schema solicitado.',
              ].join(' '),
            },
            { role: 'user', content: JSON.stringify(input) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'papastock_discrepancy', strict: true, schema: jsonSchema },
          },
        }),
      });
      if (!response.ok) throw new Error(`Groq respondió HTTP ${response.status}`);
      const envelope = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = envelope.choices?.[0]?.message?.content;
      if (!content) throw new Error('Groq no devolvió contenido.');
      const parsed = analysisSchema.parse(JSON.parse(content));

      const movementReferences = new Set(input.movements.map((item) => item.reference));
      for (const item of parsed.hypotheses.flatMap((entry) => entry.movementReferences)) {
        if (!movementReferences.has(item)) throw new Error(`Groq inventó la referencia ${item}.`);
      }
      const allowedEvidence = {
        movement: new Set(input.movements.flatMap((item) => [item.id, item.reference])),
        traceability: new Set(input.traceability.map((item) => item.id)),
        stock: new Set([input.stock.id, input.lot.id, input.lot.code]),
      };
      for (const evidence of parsed.evidence) {
        if (!allowedEvidence[evidence.type].has(evidence.reference)) {
          throw new Error(`Groq inventó evidencia ${evidence.reference}.`);
        }
      }
      if (Math.abs(parsed.explainedQuantity + parsed.unexplainedQuantity - target) > 0.001) {
        throw new Error('Groq devolvió cantidades inconsistentes con la diferencia.');
      }
      const firstReference = parsed.hypotheses.flatMap((item) => item.movementReferences)[0];
      const related = input.movements.find((item) => item.reference === firstReference);
      return {
        engine: 'llm',
        ...parsed,
        relatedMovementId: related?.id,
        relatedMovementReference: related?.reference,
      };
    } catch (error) {
      console.warn('[ai] fallback heurístico:', error instanceof Error ? error.message : error);
      return analyzeWithHeuristic(input);
    } finally {
      clearTimeout(timeout);
    }
  };
}
