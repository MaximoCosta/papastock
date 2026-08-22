import type {
  Movement,
  MovementIntent,
  MovementInterpretation,
  StockTransferPreview,
} from '../types/domain';

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error ?? fallback);
  return payload.data;
}

export async function interpretMovement(text: string): Promise<MovementInterpretation> {
  const response = await fetch('/api/ai/movement-intent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ text }),
  });
  return readResponse(response, 'No se pudo interpretar la orden.');
}

export async function previewMovement(intent: MovementIntent): Promise<StockTransferPreview> {
  const response = await fetch('/api/movements/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(intent),
  });
  return readResponse(response, 'No se pudo validar el movimiento.');
}

export async function confirmMovement(intent: MovementIntent): Promise<Movement> {
  const response = await fetch('/api/movements', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(intent),
  });
  return readResponse(response, 'No se pudo registrar el movimiento.');
}
