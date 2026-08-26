import type { StockVerificationConfirmation, StockVerificationInput } from '../types/domain';
import { apiRequest } from './apiClient';

export async function confirmStockVerification(
  input: StockVerificationInput,
  _context: { lotId: string; lotCode: string; locationId: string; previousVerified: number },
): Promise<StockVerificationConfirmation> {
  return apiRequest<StockVerificationConfirmation>(
    '/api/stock/verify',
    'No se pudo verificar el stock.',
    { method: 'POST', body: input },
  );
}
