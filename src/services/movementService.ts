import {
  demoMovementInterpretation,
  demoMovementPreview,
  demoMovementReference,
  isDemoMovementIntent,
  isDemoMovementOrder,
} from '../lib/demoMovementInterpretation';
import type {
  MovementIntent,
  MovementInterpretation,
  StockTransferPreview,
} from '../types/domain';
import {
  apiUrl,
  movementIntentBody,
  normalizeMovementInterpretation,
  normalizeTransferPreview,
  readApiData,
} from './apiClient';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export async function interpretMovement(text: string): Promise<MovementInterpretation> {
  if (isDemoMovementOrder(text)) {
    await delay(700);
    return demoMovementInterpretation();
  }

  const response = await fetch(apiUrl('/api/ai/movement-intent'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ text }),
  });
  return normalizeMovementInterpretation(await readApiData(response, 'No se pudo interpretar la orden.'));
}

export async function previewMovement(intent: MovementIntent): Promise<StockTransferPreview> {
  if (isDemoMovementIntent(intent)) {
    await delay(450);
    return demoMovementPreview();
  }

  const response = await fetch(apiUrl('/api/movements/preview'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(movementIntentBody(intent)),
  });
  return normalizeTransferPreview(await readApiData(response, 'No se pudo validar el movimiento.'));
}

export async function confirmMovement(intent: MovementIntent): Promise<{ reference: string }> {
  if (isDemoMovementIntent(intent)) {
    await delay(600);
    return demoMovementReference();
  }

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
