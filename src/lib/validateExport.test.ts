import { describe, expect, it } from 'vitest';
import { exportRequirements } from '../data/requirements';
import { lots } from '../data/lots';
import { initialTraceabilityEvents } from '../data/traceability';
import type { TraceabilityEvent } from '../types/domain';
import { validateExport } from './validateExport';

const lot = lots.find((item) => item.code === 'A-310');

describe('validateExport', () => {
  it('detecta treatment como único faltante en A-310', () => {
    const result = validateExport({
      lot,
      destinationCountry: 'Brasil',
      quantity: 18000,
      traceabilityEvents: initialTraceabilityEvents,
      requirements: exportRequirements,
    });

    expect(result.valid).toBe(false);
    expect(result.completedFields).toEqual(['lotCode', 'variety', 'quantity', 'origin']);
    expect(result.missingFields).toEqual(['treatment']);
  });

  it('pasa a ready después de confirmar un tratamiento', () => {
    const treatment: TraceabilityEvent = {
      id: 'trace-test-treatment',
      lotId: 'lot-a310',
      type: 'treatment',
      date: '2026-08-18',
      data: { product: 'Producto X' },
    };
    const result = validateExport({
      lot,
      destinationCountry: 'Brasil',
      quantity: 18000,
      traceabilityEvents: [...initialTraceabilityEvents, treatment],
      requirements: exportRequirements,
    });

    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.completedFields).toHaveLength(5);
  });

  it('informa la procedencia de cada dato encontrado', () => {
    const result = validateExport({
      lot,
      destinationCountry: 'Brasil',
      quantity: 18000,
      verifiedQuantity: 22000,
      stockLocationName: 'Frigorífico Central',
      traceabilityEvents: [
        ...initialTraceabilityEvents,
        {
          id: 'trace-provenance',
          lotId: 'lot-a310',
          type: 'treatment',
          date: '2026-08-18',
          data: { product: 'Mancozeb', origin: 'operator_confirmation' },
        },
      ],
      requirements: exportRequirements,
    });

    const byField = new Map(result.requirements.map((item) => [item.field, item]));
    expect(byField.get('lotCode')?.source?.label).toBe('Lote A-310');
    expect(byField.get('quantity')?.source).toMatchObject({ label: 'Stock verificado' });
    expect(byField.get('treatment')?.source).toMatchObject({
      label: 'Trazabilidad · 18/8/2026',
      detail: 'Confirmado por el operador',
    });
  });

  it('marca la cantidad como dato de la operación cuando excede el stock verificado', () => {
    const result = validateExport({
      lot,
      destinationCountry: 'Brasil',
      quantity: 30000,
      verifiedQuantity: 22000,
      traceabilityEvents: initialTraceabilityEvents,
      requirements: exportRequirements,
    });

    expect(result.requirements.find((item) => item.field === 'quantity')?.source?.label).toBe('Operación');
  });

  it('etiqueta los requisitos estáticos como demo', () => {
    const result = validateExport({
      lot,
      destinationCountry: 'Brasil',
      quantity: 18000,
      traceabilityEvents: initialTraceabilityEvents,
      requirements: exportRequirements,
    });

    expect(result.requirements.every((item) => item.origin === 'STATIC_DEMO')).toBe(true);
  });

  it('valida cada lote por separado en una operación de varios lotes', () => {
    const secondLot = lots.find((item) => item.code === 'B-118');
    const treatment: TraceabilityEvent = {
      id: 'trace-test-treatment-a310',
      lotId: 'lot-a310',
      type: 'treatment',
      date: '2026-08-18',
      data: { product: 'Mancozeb' },
    };
    const result = validateExport({
      destinationCountry: 'Brasil',
      traceabilityEvents: [...initialTraceabilityEvents, treatment],
      requirements: exportRequirements,
      lines: [
        { lotId: 'lot-a310', lot, quantity: 18000, verifiedQuantity: 22000 },
        { lotId: 'lot-b118', lot: secondLot, quantity: 5000, verifiedQuantity: 14400 },
      ],
    });

    const a310 = result.requirements.filter((item) => item.lotId === 'lot-a310');
    const b118 = result.requirements.filter((item) => item.lotId === 'lot-b118');

    expect(result.valid).toBe(false);
    expect(result.missingFields).toEqual(['treatment']);
    expect(a310.every((item) => item.status === 'complete')).toBe(true);
    expect(b118.find((item) => item.field === 'treatment')?.status).toBe('missing');
    expect(b118.find((item) => item.field === 'quantity')?.value).toBe('5.000 kg');
    expect(result.requirements.every((item) => !item.label.includes('·'))).toBe(true);
  });

  it('queda lista cuando todos los lotes tienen tratamiento y peso', () => {
    const secondLot = lots.find((item) => item.code === 'B-118');
    const result = validateExport({
      destinationCountry: 'Brasil',
      traceabilityEvents: [
        ...initialTraceabilityEvents,
        {
          id: 'trace-a310-treatment',
          lotId: 'lot-a310',
          type: 'treatment',
          date: '2026-08-18',
          data: { product: 'Mancozeb' },
        },
        {
          id: 'trace-b118-treatment',
          lotId: 'lot-b118',
          type: 'treatment',
          date: '2026-08-10',
          data: { product: 'Metalaxil' },
        },
      ],
      requirements: exportRequirements,
      lines: [
        { lotId: 'lot-a310', lot, quantity: 18000 },
        { lotId: 'lot-b118', lot: secondLot, quantity: 5000 },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.requirements).toHaveLength(10);
  });

  it('completa origen desde la línea cuando la ficha del lote no lo trae', () => {
    const result = validateExport({
      destinationCountry: 'Brasil',
      traceabilityEvents: [
        ...initialTraceabilityEvents,
        {
          id: 'trace-origin-treatment',
          lotId: 'lot-a310',
          type: 'treatment',
          date: '2026-08-18',
          data: { producto: 'Mancozeb' },
        },
      ],
      requirements: exportRequirements,
      lines: [{
        lotId: 'lot-a310',
        lot: lot ? { ...lot, origin: '' } : undefined,
        quantity: 18000,
        origin: 'Balcarce, Buenos Aires, Argentina',
      }],
    });

    expect(result.requirements.find((item) => item.field === 'origin')?.status).toBe('complete');
    expect(result.requirements.find((item) => item.field === 'treatment')?.status).toBe('complete');
    expect(result.valid).toBe(true);
  });

  it('encuentra el tratamiento aunque el evento use el código de lote', () => {
    const result = validateExport({
      lot,
      destinationCountry: 'Brasil',
      quantity: 18000,
      traceabilityEvents: [
        ...initialTraceabilityEvents,
        {
          id: 'trace-code-ref',
          lotId: 'A-310',
          type: 'treatment',
          date: '2026-08-18',
          data: { product: 'Mancozeb' },
        },
      ],
      requirements: exportRequirements,
    });

    expect(result.missingFields).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

