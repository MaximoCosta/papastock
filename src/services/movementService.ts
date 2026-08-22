import type {
  MovementIntent,
  MovementInterpretation,
  StockTransferPreview,
} from '../types/domain';import {
  apiUrl,
  movementIntentBody,
  normalizeMovementInterpretation,
  normalizeTransferPreview,
  readApiData,
} from './apiClient';

export async function interpretMovement(text: string): Promise<MovementInterpretation> {
  const response = await fetch(apiUrl('/api/ai/movement-intent'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ text }),
  });
  return normalizeMovementInterpretation(await readApiData(response, 'No se pudo interpretar la orden.'));
}

export async function previewMovement(intent: MovementIntent): Promise<StockTransferPreview> {
  const response = await fetch(apiUrl('/api/movements/preview'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(movementIntentBody(intent)),
  });
  return normalizeTransferPreview(await readApiData(response, 'No se pudo validar el movimiento.'));
}

export async function confirmMovement(intent: MovementIntent): Promise<{ reference: string }> {
  const response = await fetch(apiUrl('/api/movements'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(movementIntentBody(intent)),
  });
  const payload = await readApiData<Record<string, unknown>>(response, 'No se pudo registrar el movimiento.');
  if (typeof payload.reference === 'string' && payload.reference) {
    return { reference: payload.reference };
  }
  if (payload.status === 'success') return { reference: 'Confirmado' };
  throw new Error('No se pudo registrar el movimiento.');
}
