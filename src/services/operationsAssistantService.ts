import type { OperationsAssistantAnswer, OperationsAssistantStatus } from '../types/operationsAssistant';
import { apiUrl, readApiData } from './apiClient';

export async function askOperationsAssistant(question: string): Promise<OperationsAssistantAnswer> {
  const response = await fetch(apiUrl('/api/ai/operations'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ question }),
  });
  return readApiData(response, 'El asistente de inventario no está disponible.');
}

export async function loadOperationsAssistantStatus(): Promise<OperationsAssistantStatus> {
  const response = await fetch(apiUrl('/api/ai/status'), {
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  return readApiData(response, 'No se pudo consultar el estado de Groq en el servidor.');
}
