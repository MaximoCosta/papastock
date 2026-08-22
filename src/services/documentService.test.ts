import { describe, expect, it } from 'vitest';
import { lots } from '../data/lots';
import { transporters } from '../data/transporters';
import { initialTraceabilityEvents } from '../data/traceability';
import { buildExportOperation } from './exportService';
import { mockDocumentService } from './documentService';

const a310 = lots.find((lot) => lot.code === 'A-310');
const h118 = lots.find((lot) => lot.code === 'H-118');
const transporter = transporters[0];

function operationFor(items: Array<{ lotId: string; quantity: number }>) {
  return buildExportOperation(items, 'Brasil', {
    buyerName: 'Distribuidora Sul Ltda.',
    buyerTaxId: '08.441.220/0001-55',
    buyerAddress: 'Av. dos Portuários 1840',
    buyerCity: 'Santos, SP',
    incoterm: 'FOB',
    departurePort: 'Bahía Blanca',
    arrivalPort: 'Santos',
    departureDate: '2026-08-28',
    notes: 'Mantener cadena de frío 3–5 °C.',
    paymentTerms: 'T/T 30 días fecha factura',
    validityDays: 15,
    unitPrice: 0.35,
    currency: 'USD',
    bagWeightKg: 25,
    packaging: 'Bolsa de malla',
    caliber: '28–55 mm',
    category: 'Semilla de papa',
    hsCode: '0701.10',
    transporterId: transporter.id,
  });
}

describe('mockDocumentService', () => {
  it('emite una proforma con precios, empaque y trazabilidad del lote', () => {
    if (!a310) throw new Error('A-310 missing');
    const events = [
      ...initialTraceabilityEvents,
      {
        id: 'trace-test-treatment',
        lotId: a310.id,
        type: 'treatment' as const,
        date: '2026-08-18',
        data: { product: 'Mancozeb' },
      },
    ];
    const document = mockDocumentService.createProforma({
      operation: operationFor([{ lotId: a310.id, quantity: 18000 }]),
      lots: [a310],
      events,
      transporter,
    });

    expect(document.type).toBe('proforma');
    expect(document.lotCode).toBe('A-310');
    expect(document.treatment).toBe('Mancozeb');
    expect(document.producer).toBe('La Esperanza Agro');
    expect(document.bagCount).toBe(720);
    expect(document.netWeightKg).toBe(18000);
    expect(document.grossWeightKg).toBe(18108);
    expect(document.unitPrice).toBe(0.35);
    expect(document.items).toHaveLength(1);
    expect(document.items[0].qualityResult).toContain('Aprobado');
    expect(document.buyerTaxId).toBe('08.441.220/0001-55');
    expect(document.hsCode).toBe('0701.10');
    expect(document.validUntil).toBe('2026-09-12');
  });

  it('desglosa varios lotes en factura, remito y lista de empaque del mismo paquete', () => {
    if (!a310 || !h118) throw new Error('lots missing');
    const operation = operationFor([
      { lotId: a310.id, quantity: 18000 },
      { lotId: h118.id, quantity: 5000 },
    ]);
    const context = {
      operation,
      lots: [a310, h118],
      events: initialTraceabilityEvents,
      transporter,
      originLocation: 'Frigorífico Central',
    };

    const factura = mockDocumentService.createFactura(context);
    const remito = mockDocumentService.createExportRemito(context);
    const packingList = mockDocumentService.createListaEmpaque(context);

    expect(factura.operationId).toBe(operation.id);
    expect(remito.operationId).toBe(operation.id);
    expect(packingList.operationId).toBe(operation.id);
    expect(factura.items.map((item) => item.lotCode)).toEqual(['A-310', 'H-118']);
    expect(factura.quantity).toBe(23000);
    expect(factura.items[0].lineTotal).toBe(18000 * 0.35);
    expect(packingList.bagCount).toBe(920);
    expect(remito.originLocation).toBe('Frigorífico Central');
    expect(packingList.type).toBe('lista_empaque');
  });
});
