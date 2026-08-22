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

<<<<<<< HEAD
export async function confirmMovement(intent: MovementIntent): Promise<{ reference: string }> {
  if (isDemoMovementIntent(intent)) {
    await delay(600);
    return demoMovementReference();
  }

=======
export async function confirmMovement(intent: MovementIntent): Promise<{ reference: string; remitoNumber?: string; id?: string }> {
>>>>>>> 49b6fb5abf5343428dd513818e4a7aad8fd388d7
  const response = await fetch(apiUrl('/api/movements'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(movementIntentBody(intent)),
  });
  const payload = await readApiData<Record<string, unknown>>(response, 'No se pudo registrar el movimiento.');
  if (typeof payload.reference === 'string' && payload.reference) {
    return {
      reference: payload.reference,
      remitoNumber: typeof payload.remitoNumber === 'string' ? payload.remitoNumber : undefined,
      id: typeof payload.id === 'string' ? payload.id : undefined,
    };
  }
  if (payload.status === 'success') return { reference: 'Confirmado' };
  throw new Error('No se pudo registrar el movimiento.');
}

export async function receiveMovement(movementId: string, body: {
  date: string;
  items?: Array<{ movementItemId: string; receivedQuantity: number }>;
  receivedTotal?: number;
  unit?: 'bags' | 'kg';
}) {
  const response = await fetch(apiUrl(`/api/movements/${movementId}/reception`), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return readApiData(response, 'No se pudo registrar la recepción.');
}

export async function correctMovement(body: {
  originalMovementId: string;
  locationId: string;
  fromLotCode: string;
  toLotCode: string;
  quantity: number;
  unit: 'bags' | 'kg';
}) {
  const response = await fetch(apiUrl('/api/movements/corrections'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return readApiData(response, 'No se pudo registrar la corrección.');
}

export async function createStockCount(body: {
  locationId?: string;
  location?: string;
  lotId?: string;
  lotCode?: string;
  observedQuantity: number;
  unit: 'bags' | 'kg';
  date: string;
  notes?: string;
}) {
  const response = await fetch(apiUrl('/api/stock-counts'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return readApiData(response, 'No se pudo registrar el conteo.');
}
