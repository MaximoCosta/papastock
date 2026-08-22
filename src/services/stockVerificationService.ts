import type { StockVerificationConfirmation, StockVerificationInput } from '../types/domain';
import { apiUrl, readApiData } from './apiClient';

export async function confirmStockVerification(
  input: StockVerificationInput,
  _context: { lotId: string; lotCode: string; locationId: string; previousVerified: number },
): Promise<StockVerificationConfirmation> {
  const response = await fetch(apiUrl('/api/stock/verify'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(input),
  });
  return readApiData<StockVerificationConfirmation>(response, 'No se pudo verificar el stock.');
}
