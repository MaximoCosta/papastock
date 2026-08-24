import type { OperationsAssistantAnswer } from '../types/operationsAssistant';
import { apiUrl, readApiData } from './apiClient';

export async function askOperationsAssistant(question: string): Promise<OperationsAssistantAnswer> {
  const response = await fetch(apiUrl('/api/ai/operations'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ question }),
  });
  return readApiData(response, 'El asistente de inventario no está disponible.');
}
