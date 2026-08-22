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
});

