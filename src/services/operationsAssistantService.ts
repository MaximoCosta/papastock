import type { OperationsAssistantAnswer, OperationsAssistantStatus } from '../types/operationsAssistant';
import { apiRequest } from './apiClient';

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeOperationsAnswer(value: unknown): OperationsAssistantAnswer {
  const candidate = (value ?? {}) as Record<string, unknown>;
  const references = Array.isArray(candidate.references)
    ? candidate.references
    : Array.isArray(candidate.evidence) ? candidate.evidence : [];
  const evidence = references.map((item) => {
    const reference = (item ?? {}) as Record<string, unknown>;
    return {
      source: asText(reference.type ?? reference.source, 'reference'),
      recordId: typeof (reference.reference ?? reference.recordId) === 'string' ? String(reference.reference ?? reference.recordId) : null,
      recordLabel: typeof reference.recordLabel === 'string' ? reference.recordLabel : null,
      description: asText(reference.description, 'Referencia del backend.'),
    };
  });
  const engine = candidate.engine === 'llm' || candidate.engine === 'heuristic' || candidate.engine === 'deterministic'
    ? candidate.engine
    : undefined;
  return {
    answer: asText(candidate.answer, 'El backend no devolvió una respuesta.'),
    ...(candidate.confidence === 'high' || candidate.confidence === 'medium' || candidate.confidence === 'low'
      ? { confidence: candidate.confidence } : {}),
    ...(candidate.dataQuality === 'authoritative' || candidate.dataQuality === 'operational_only' || candidate.dataQuality === 'incomplete'
      ? { dataQuality: candidate.dataQuality } : {}),
    entities: Array.isArray(candidate.entities) ? candidate.entities as OperationsAssistantAnswer['entities'] : [],
    warnings: Array.isArray(candidate.warnings) ? candidate.warnings.filter((item): item is string => typeof item === 'string') : [],
    evidence,
    ...(engine ? { engine } : {}),
  };
}

export async function askOperationsAssistant(question: string): Promise<OperationsAssistantAnswer> {
  const data = await apiRequest<unknown>(
    '/api/ai/operations',
    'El asistente de inventario no está disponible.',
    { method: 'POST', body: { question } },
  );
  return normalizeOperationsAnswer(data);
}

export async function loadOperationsAssistantStatus(): Promise<OperationsAssistantStatus> {
  return apiRequest<OperationsAssistantStatus>(
    '/api/ai/status',
    'No se pudo consultar el estado de Groq en el servidor.',
  );
}
