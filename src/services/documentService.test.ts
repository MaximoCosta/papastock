import { describe, expect, it } from 'vitest';
import { lots } from '../data/lots';
import { initialTraceabilityEvents } from '../data/traceability';
import { buildExportItems, mockDocumentService } from './documentService';
import { buildExportOperation } from './exportService';

const a310 = lots.find((lot) => lot.code === 'A-310');
const b118 = lots.find((lot) => lot.code === 'B-118');

describe('buildExportItems', () => {
  it('no agrupa lotes distintos y conserva el peso de cada línea', () => {
    const items = buildExportItems(
      [
        { lotId: 'lot-a310', quantity: 18000 },
        { lotId: 'lot-b118', quantity: 5000 },
      ],
      lots,
      initialTraceabilityEvents,
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ lotId: 'lot-a310', lotCode: 'A-310', quantity: 18000 });
    expect(items[1]).toMatchObject({ lotId: 'lot-b118', lotCode: 'B-118', quantity: 5000 });
  });
});

describe('mockDocumentService', () => {
  it('emite una proforma con una fila por lote y el total de la operación', () => {
    if (!a310 || !b118) throw new Error('Faltan lotes de demo.');

    const operation = buildExportOperation(
      [
        { lotId: a310.id, quantity: 18000 },
        { lotId: b118.id, quantity: 5000 },
      ],
      'Brasil',
      { buyerName: 'Distribuidora Sul Ltda.', incoterm: 'FOB' },
    );
    const document = mockDocumentService.createProforma(operation, [a310, b118], initialTraceabilityEvents);

    expect(operation.quantity).toBe(23000);
    expect(document.items).toHaveLength(2);
    expect(document.quantity).toBe(23000);
    expect(document.lotCode).toBe('A-310 · B-118');
    expect(document.items.map((item) => item.quantity)).toEqual([18000, 5000]);
  });
});
