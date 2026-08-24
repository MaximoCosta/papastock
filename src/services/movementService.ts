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

export async function confirmMovement(intent: MovementIntent): Promise<{ reference: string; remitoNumber?: string; id?: string }> {
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
}, idempotencyKey: string) {
  const response = await fetch(apiUrl(`/api/movements/${movementId}/reception`), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', 'Idempotency-Key': idempotencyKey },
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
