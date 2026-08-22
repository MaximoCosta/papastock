import type { StockVerificationConfirmation, StockVerificationInput, TraceabilityEvent } from '../types/domain';
import { apiUrl, readApiData, toIsoDateTime, usesRemoteApi } from './apiClient';

function verificationEvent(input: StockVerificationInput & {
  lotId: string;
  locationId?: string;
  countedQuantity: number;
}): Omit<TraceabilityEvent, 'id'> {
  return {
    lotId: input.lotId,
    type: 'stock_verification',
    date: input.date,
    locationId: input.locationId,
    data: {
      verifiedQuantity: input.countedQuantity,
      bags: input.bags,
      notes: input.notes,
      origin: 'operator_confirmation',
    },
  };
}

export async function confirmStockVerification(
  input: StockVerificationInput,
  context: { lotId: string; lotCode: string; locationId: string; previousVerified: number },
): Promise<StockVerificationConfirmation> {
  const eventPayload = verificationEvent({ ...input, lotId: context.lotId, locationId: context.locationId });

  if (usesRemoteApi()) {
    const response = await fetch(apiUrl('/api/traceability'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        lotId: eventPayload.lotId,
        type: eventPayload.type,
        date: toIsoDateTime(eventPayload.date),
        ...(eventPayload.locationId ? { locationId: eventPayload.locationId } : {}),
        data: eventPayload.data,
      }),
    });
    const saved = await readApiData<TraceabilityEvent>(response, 'No se pudo registrar la verificación.').catch(() => undefined);
    return {
      persisted: Boolean(saved),
      correction: {
        stockRecordId: input.stockRecordId,
        lotCode: context.lotCode,
        countedQuantity: input.countedQuantity,
        previousVerified: context.previousVerified,
        notes: input.notes,
      },
      event: saved ?? { id: `verify-${input.stockRecordId}`, ...eventPayload },
    };
  }

  const response = await fetch('/api/stock/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(input),
  });
  return readApiData<StockVerificationConfirmation>(response, 'No se pudo verificar el stock.');
}
