import type { Lot, TraceabilityEvent } from '../types/domain';
import type { ExportOperation, GeneratedDocument } from '../types/export';

export interface DocumentService {
  createProforma(
    operation: ExportOperation,
    lot: Lot,
    events: TraceabilityEvent[],
  ): GeneratedDocument;
}

export const mockDocumentService: DocumentService = {
  createProforma(operation, lot, events) {
    const treatment = events
      .filter((event) => event.lotId === lot.id && event.type === 'treatment')
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    return {
      id: `PF-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      operationId: operation.id,
      createdAt: new Date().toISOString(),
      exporter: 'Papasud',
      lotCode: lot.code,
      variety: lot.variety,
      quantity: operation.quantity,
      origin: lot.origin,
      destinationCountry: operation.destinationCountry,
      treatment: typeof treatment?.data.product === 'string' ? treatment.data.product : 'No informado',
      campaign: lot.campaign,
    };
  },
};
