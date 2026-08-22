import type { PlanillaImportConfirmation, PlanillaImportPreview, StockIntakeInput } from '../types/domain';

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error ?? fallback);
  return payload.data;
}

export async function previewStockIntake(input: StockIntakeInput): Promise<PlanillaImportPreview> {
  const response = await fetch('/api/stock/intake/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(input),
  });
  return readResponse(response, 'No se pudo validar la carga de stock.');
}

export async function confirmStockIntake(input: StockIntakeInput): Promise<PlanillaImportConfirmation> {
  const response = await fetch('/api/stock/intake', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(input),
  });
  return readResponse(response, 'No se pudo cargar el stock.');
}
