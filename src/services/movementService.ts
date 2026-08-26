import type {
  MovementIntent,
  MovementInterpretation,
  StockTransferPreview,
} from '../types/domain';
import {
  apiRequest,
  movementIntentBody,
  normalizeMovementInterpretation,
  normalizeTransferPreview,
} from './apiClient';

export async function interpretMovement(text: string): Promise<MovementInterpretation> {
  return normalizeMovementInterpretation(
    await apiRequest('/api/ai/movement-intent', 'No se pudo interpretar la orden.', {
      method: 'POST',
      body: { text },
    }),
  );
}

export async function previewMovement(intent: MovementIntent): Promise<StockTransferPreview> {
  return normalizeTransferPreview(
    await apiRequest('/api/movements/preview', 'No se pudo validar el movimiento.', {
      method: 'POST',
      body: movementIntentBody(intent),
    }),
  );
}

export async function confirmMovement(intent: MovementIntent): Promise<{ reference: string; remitoNumber?: string; id?: string }> {
  const payload = await apiRequest<Record<string, unknown>>(
    '/api/movements',
    'No se pudo registrar el movimiento.',
    { method: 'POST', body: movementIntentBody(intent) },
  );
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
  // El backend exige esta clave: repetir el request con la misma key no vuelve a aplicar
  // la recepción, así un reintento por timeout no duplica stock.
  return apiRequest(`/api/movements/${movementId}/reception`, 'No se pudo registrar la recepción.', {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export async function correctMovement(body: {
  originalMovementId: string;
  locationId: string;
  fromLotCode: string;
  toLotCode: string;
  quantity: number;
  unit: 'bags' | 'kg';
}) {
  return apiRequest('/api/movements/corrections', 'No se pudo registrar la corrección.', {
    method: 'POST',
    body,
  });
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
  return apiRequest('/api/stock-counts', 'No se pudo registrar el conteo.', {
    method: 'POST',
    body,
  });
}
