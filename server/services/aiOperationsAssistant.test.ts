import { describe, expect, it, vi } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { buildAiOperationsContext, createAiOperationsAssistant } from './aiOperationsAssistant';

const snapshot: PapaStockSnapshot = {
  locations: [{ id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' }],
  shelfUnits: [], shelves: [], transporters: [],
  lots: [
    { id: 'lot-show-001', code: 'SHOW-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
    { id: 'lot-old', code: 'OLD-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
  ],
  stockRecords: [
    { id: 'stock-show', lotId: 'lot-show-001', locationId: 'loc-oriente', declaredQuantity: 8000, verifiedQuantity: 7900, unit: 'kg', updatedAt: '2026-08-24', verificationPending: false },
    { id: 'stock-old', lotId: 'lot-old', locationId: 'loc-oriente', declaredQuantity: 10, verifiedQuantity: 10, unit: 'kg', updatedAt: '2026-08-24', verificationPending: true },
  ],
  movements: [{
    id: 'movement-show-import', reference: 'SHOWCASE-IMPORT-001', destinationLocationId: 'loc-oriente',
    date: '2026-08-24', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
    items: [{ id: 'item-show', movementId: 'movement-show-import', lotId: 'lot-show-001', dispatchedQuantity: 8000, unit: 'kg', sortOrder: 0 }],
  }],
  traceabilityEvents: [], discrepancies: [], stockCounts: [],
};

const envelope = (content: unknown) => new Response(JSON.stringify({
  choices: [{ message: { content: JSON.stringify(content) } }],
}), { status: 200, headers: { 'content-type': 'application/json' } });

describe('asistente operativo read-only', () => {
  it('construye contexto desde snapshot y distingue SHOW-* MATCH de la autoridad global', () => {
    const context = buildAiOperationsContext(snapshot, '2026-08-24T12:00:00.000Z');
    expect(context.timestamp).toBe('2026-08-24T12:00:00.000Z');
    expect(context.movementItems).toHaveLength(1);
    expect(context.ledger.ledgerAuthority).toBe(false);
    expect(context.ledger.classifications.find((item) => item.lotCode === 'SHOW-001')).toMatchObject({ classification: 'MATCH' });
    expect(context.ledger.classifications.find((item) => item.lotCode === 'OLD-001')).toMatchObject({ classification: 'MISSING_LEDGER_BALANCE' });
  });

  it('valida structured output, canonicaliza entidades y agrega warning de calidad', async () => {
    const fetchImpl = vi.fn(async () => envelope({
      answer: 'Stock operativo registrado: 8.000 kg en Campo Oriente.',
      confidence: 'high', dataQuality: 'operational_only',
      entities: [{ type: 'lot', id: 'lot-show-001', label: 'etiqueta inventada' }],
      warnings: [], evidence: [{ source: 'stock_records', description: 'Registro stock-show.' }],
    })) as unknown as typeof fetch;
    const answer = await createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      '¿Cuánto stock hay de SHOW-001?', buildAiOperationsContext(snapshot),
    );
    expect(answer.entities).toEqual([{ type: 'lot', id: 'lot-show-001', label: 'SHOW-001' }]);
    expect(answer.warnings[0]).toContain('stock operativo persistido');
  });

  it.each([
    { entities: [{ type: 'lot', id: 'lot-inventado', label: 'X' }], dataQuality: 'operational_only', answer: 'X' },
    { entities: [], dataQuality: 'authoritative', answer: 'Todo está conciliado.' },
    { entities: [], dataQuality: 'operational_only', answer: 'El ledger confirma todo el inventario.' },
  ])('rechaza alucinaciones o autoridad inexistente', async (override) => {
    const fetchImpl = vi.fn(async () => envelope({
      answer: override.answer,
      confidence: 'high', dataQuality: override.dataQuality,
      entities: override.entities, warnings: [], evidence: [{ source: 'ledger', description: 'Ledger.' }],
    })) as unknown as typeof fetch;
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      'Resumen', buildAiOperationsContext(snapshot),
    )).rejects.toMatchObject({ status: 502 });
  });

  it('devuelve error controlado cuando Groq falla, sin fallback inventado', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch;
    await expect(createAiOperationsAssistant({ apiKey: 'test', model: 'test', timeoutMs: 100, fetchImpl })(
      'Resumen', buildAiOperationsContext(snapshot),
    )).rejects.toMatchObject({ status: 502, message: 'El asistente de inventario no está disponible en este momento.' });
  });
});
