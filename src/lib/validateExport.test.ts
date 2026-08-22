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
});

