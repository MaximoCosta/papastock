import type { PlanillaImportConfirmation, PlanillaImportPreview, StockIntakeInput } from '../types/domain';
import { apiRequest } from './apiClient';

export async function previewStockIntake(input: StockIntakeInput): Promise<PlanillaImportPreview> {
  return apiRequest<PlanillaImportPreview>(
    '/api/stock/intake/preview',
    'No se pudo validar la carga de stock.',
    { method: 'POST', body: input },
  );
}

export async function confirmStockIntake(input: StockIntakeInput): Promise<PlanillaImportConfirmation> {
  return apiRequest<PlanillaImportConfirmation>(
    '/api/stock/intake',
    'No se pudo cargar el stock.',
    { method: 'POST', body: input },
  );
}
