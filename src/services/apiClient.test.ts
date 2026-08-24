import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiUrl,
  normalizeDiscrepancyAnalysis,
  normalizeMovementInterpretation,
  normalizeSnapshot,
  normalizeTransferPreview,
} from './apiClient';

afterEach(() => vi.unstubAllEnvs());

describe('backend adapters', () => {
  it('ignora backends remotos en producción y conserva el opt-in en desarrollo', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://spring.example.test');
    vi.stubEnv('DEV', false);
    expect(apiUrl('/api/snapshot')).toBe('/api/snapshot');
    vi.stubEnv('DEV', true);
    expect(apiUrl('/api/snapshot')).toBe('https://spring.example.test/api/snapshot');
  });
  it('maps Spring movement intent without action/engine', () => {
    expect(normalizeMovementInterpretation({
      lotCode: 'A-204',
      origin: 'Planta',
      destination: 'Puerto',
      quantityKg: 25000,
      confidence: 0.95,
    })).toEqual({
      action: 'transfer',
      remitoNumber: undefined,
      lotCode: 'A-204',
      origin: 'Planta',
      destination: 'Puerto',
      quantityKg: 25000,
      items: [{ lotCode: 'A-204', quantity: 25000, unit: 'kg' }],
      engine: 'llm',
    });
  });

  it('maps Spring discrepancy payload to the panel contract', () => {
    const analysis = normalizeDiscrepancyAnalysis({
      engine: 'llm',
      hypothesis: 'Falta registrar MV-1032.',
      confidence: 0.9,
      suggestedAction: 'Verificar bloqueo.',
    });
    expect(analysis.summary).toBe('Falta registrar MV-1032.');
    expect(analysis.recommendedAction).toBe('Verificar bloqueo.');
    expect(analysis.hypotheses[0]?.explanation).toBe('Falta registrar MV-1032.');
  });

  it('coerces null verifiedQuantity and confirmed movements', () => {
    const snapshot = normalizeSnapshot({
      locations: [{ id: 'loc-1', name: 'Galpón', type: 'warehouse' }],
      lots: [{ id: 'lot-1', code: 'AGATA-241', variety: 'Agata', campaign: '2026', producer: '', origin: '' }],
      stockRecords: [{
        id: 'stock-1',
        lotId: 'lot-1',
        locationId: 'loc-1',
        declaredQuantity: 32160,
        verifiedQuantity: null as unknown as number,
        updatedAt: '2026-08-22T17:22:51Z',
        verificationPending: true,
      }],
      movements: [{
        id: 'mv-1',
        lotId: 'lot-1',
        quantity: 35160,
        date: '2026-03-09T03:00:00Z',
        status: 'confirmed' as unknown as 'completed',
        reference: 'XLS-1001',
      }],
      traceabilityEvents: [],
    });

    expect(snapshot.stockRecords[0]?.verifiedQuantity).toBe(0);
    expect(snapshot.movements[0]?.status).toBe('completed');
  });

  it('keeps preview errors as structured items', () => {
    const preview = normalizeTransferPreview({
      valid: false,
      errors: ['Stock insuficiente'],
      originStock: { declaredQuantity: 30000, verifiedQuantity: null },
    });
    expect(preview.errors).toEqual([{ code: 'VALIDATION', message: 'Stock insuficiente' }]);
    expect(preview.originStock?.verifiedQuantity).toBe(0);
  });
});
