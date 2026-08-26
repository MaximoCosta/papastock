import type { OperationsAssistantAnswer } from '../types/operationsAssistant';
import { apiRequest } from './apiClient';

export async function askOperationsAssistant(question: string): Promise<OperationsAssistantAnswer> {
  return apiRequest<OperationsAssistantAnswer>(
    '/api/ai/operations',
    'El asistente de inventario no está disponible.',
    { method: 'POST', body: { question } },
  );
}
