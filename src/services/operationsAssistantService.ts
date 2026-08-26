import type { OperationsAssistantAnswer, OperationsAssistantStatus } from '../types/operationsAssistant';
import { apiRequest } from './apiClient';

export async function askOperationsAssistant(question: string): Promise<OperationsAssistantAnswer> {
  return apiRequest<OperationsAssistantAnswer>(
    '/api/ai/operations',
    'El asistente de inventario no está disponible.',
    { method: 'POST', body: { question } },
  );
}

export async function loadOperationsAssistantStatus(): Promise<OperationsAssistantStatus> {
  return apiRequest<OperationsAssistantStatus>(
    '/api/ai/status',
    'No se pudo consultar el estado de Groq en el servidor.',
  );
}
