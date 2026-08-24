import { describe, expect, it } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { buildAiOperationsContext, measureAiOperationsContext } from './aiOperationsContext';

const snapshot: PapaStockSnapshot = {
  locations: [
    { id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' },
    { id: 'loc-frig-a', name: 'Frigorífico A', type: 'cold_storage' },
    { id: 'loc-other', name: 'Galpón Irrelevante', type: 'warehouse' },
  ],
  shelfUnits: [], shelves: [], transporters: [],
  lots: [
    { id: 'lot-show-001', code: 'SHOW-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
    { id: 'lot-show-002', code: 'SHOW-002', variety: 'Innovator', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
    { id: 'lot-show-003', code: 'SHOW-003', variety: 'Atlantic', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
    { id: 'lot-other', code: 'OTHER-999', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce' },
  ],
  stockRecords: [
    { id: 'stock-show-001-oriente', lotId: 'lot-show-001', locationId: 'loc-oriente', declaredQuantity: 8_000, verifiedQuantity: 7_900, unit: 'kg', updatedAt: '2026-08-24' },
    { id: 'stock-show-001-frig', lotId: 'lot-show-001', locationId: 'loc-frig-a', declaredQuantity: 2_250, verifiedQuantity: 2_250, unit: 'kg', updatedAt: '2026-08-24' },
    { id: 'stock-show-002-oriente', lotId: 'lot-show-002', locationId: 'loc-oriente', declaredQuantity: 5_000, verifiedQuantity: 5_000, unit: 'kg', updatedAt: '2026-08-24' },
    { id: 'stock-show-002-frig', lotId: 'lot-show-002', locationId: 'loc-frig-a', declaredQuantity: 750, verifiedQuantity: 750, unit: 'kg', updatedAt: '2026-08-24' },
    { id: 'stock-show-003-oriente', lotId: 'lot-show-003', locationId: 'loc-oriente', declaredQuantity: 3_000, verifiedQuantity: 0, verificationPending: true, unit: 'kg', updatedAt: '2026-08-24' },
    { id: 'stock-other', lotId: 'lot-other', locationId: 'loc-other', declaredQuantity: 1, verifiedQuantity: 1, unit: 'kg', updatedAt: '2026-08-24' },
  ],
  movements: [
    {
      id: 'movement-show-001-import', reference: 'SHOWCASE-IMPORT-001', destinationLocationId: 'loc-oriente',
      date: '2026-08-20', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
      items: [{ id: 'item-show-001-import', movementId: 'movement-show-001-import', lotId: 'lot-show-001', dispatchedQuantity: 10_250, unit: 'kg', sortOrder: 0 }],
    },
    {
      id: 'movement-show-001-transfer', reference: 'SHOWCASE-TRANSFER-001', originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a',
      date: '2026-08-21', status: 'completed', kind: 'transfer', receptionStatus: 'received',
      items: [{ id: 'item-show-001-transfer', movementId: 'movement-show-001-transfer', lotId: 'lot-show-001', dispatchedQuantity: 2_250, receivedQuantity: 2_250, unit: 'kg', sortOrder: 0 }],
    },
    {
      id: 'movement-show-002-import', reference: 'SHOWCASE-IMPORT-002', destinationLocationId: 'loc-oriente',
      date: '2026-08-20', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
      items: [{ id: 'item-show-002-import', movementId: 'movement-show-002-import', lotId: 'lot-show-002', dispatchedQuantity: 5_750, unit: 'kg', sortOrder: 0 }],
    },
    {
      id: 'movement-showcase-transfer-002', reference: 'SHOWCASE-TRANSFER-002', originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a',
      date: '2026-08-22', status: 'pending', kind: 'transfer', receptionStatus: 'pending',
      items: [{ id: 'item-show-002-transfer', movementId: 'movement-showcase-transfer-002', lotId: 'lot-show-002', dispatchedQuantity: 750, unit: 'kg', sortOrder: 0 }],
    },
    {
      id: 'movement-show-003-import', reference: 'SHOWCASE-IMPORT-003', destinationLocationId: 'loc-oriente',
      date: '2026-08-20', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
      items: [{ id: 'item-show-003-import', movementId: 'movement-show-003-import', lotId: 'lot-show-003', dispatchedQuantity: 3_000, unit: 'kg', sortOrder: 0 }],
    },
    {
      id: 'movement-other', reference: 'IRRELEVANT-999', destinationLocationId: 'loc-other',
      date: '2026-08-19', status: 'completed', kind: 'import', receptionStatus: 'not_applicable',
      items: [{ id: 'item-other', movementId: 'movement-other', lotId: 'lot-other', dispatchedQuantity: 1, unit: 'kg', sortOrder: 0 }],
    },
  ],
  traceabilityEvents: [
    { id: 'trace-show-001', lotId: 'lot-show-001', type: 'harvest', date: '2026-08-18', locationId: 'loc-oriente', data: { source: 'showcase' } },
    { id: 'trace-other', lotId: 'lot-other', type: 'harvest', date: '2026-08-18', locationId: 'loc-other', data: { source: 'irrelevant' } },
  ],
  discrepancies: [], stockCounts: [],
};

const build = (question: string, source = snapshot) => buildAiOperationsContext(question, source, '2026-08-24T12:00:00.000Z');

describe('proyección determinística del contexto operativo', () => {
  it('LOT_STOCK selecciona sólo SHOW-001 y sus dos coordenadas', () => {
    const context = build('¿Cuánto stock hay de show-001?');
    expect(context.intent).toBe('LOT_STOCK');
    expect(context.lots.map((lot) => lot.code)).toEqual(['SHOW-001']);
    expect(context.stockRecords.map((record) => record.id)).toEqual(['stock-show-001-frig', 'stock-show-001-oriente']);
    expect(context.locations.map((location) => location.name)).toEqual(['Frigorífico A', 'Campo Oriente']);
    expect(context.movements).toEqual([]);
    expect(context.ledger.classifications).toHaveLength(2);
  });

  it('LOT_LOCATION selecciona sólo SHOW-002 y sus ubicaciones', () => {
    const context = build('¿Dónde está SHOW-002?');
    expect(context.intent).toBe('LOT_LOCATION');
    expect(context.lots.map((lot) => lot.code)).toEqual(['SHOW-002']);
    expect(context.stockRecords).toHaveLength(2);
    expect(context.locations.map((location) => location.id).sort()).toEqual(['loc-frig-a', 'loc-oriente']);
    expect(context.movements).toEqual([]);
  });

  it('PENDING_VERIFICATION incluye SHOW-003 y excluye registros verificados', () => {
    const context = build('¿Qué lotes tienen verificación pendiente?');
    expect(context.intent).toBe('PENDING_VERIFICATION');
    expect(context.lots.map((lot) => lot.code)).toEqual(['SHOW-003']);
    expect(context.stockRecords.map((record) => record.id)).toEqual(['stock-show-003-oriente']);
  });

  it('PENDING_RECEPTION incluye SHOWCASE-TRANSFER-002 con su item y endpoints', () => {
    const context = build('¿Qué movimientos están pendientes de recepción?');
    expect(context.intent).toBe('PENDING_RECEPTION');
    expect(context.movements.map((movement) => movement.reference)).toEqual(['SHOWCASE-TRANSFER-002']);
    expect(context.movementItems.map((item) => item.id)).toEqual(['item-show-002-transfer']);
    expect(context.lots.map((lot) => lot.code)).toEqual(['SHOW-002']);
    expect(context.locations.map((location) => location.id).sort()).toEqual(['loc-frig-a', 'loc-oriente']);
  });

  it('LEDGER_AUTHORITY usa sólo el resumen canónico y conserva authority=true', () => {
    const context = build('¿El ledger es completamente autoritativo?');
    expect(context.intent).toBe('LEDGER_AUTHORITY');
    expect(context.ledger).toMatchObject({ ledgerAuthority: true, blockingIssues: 0 });
    expect(context.ledger.classificationCounts).toMatchObject({ MATCH: 6, MISSING_LEDGER_BALANCE: 0, INVALID_NEGATIVE_BALANCE: 0 });
    expect(context.ledger.classifications).toEqual([]);
    expect(context.lots).toEqual([]);
    expect(context.stockRecords).toEqual([]);
    expect(context.movements).toEqual([]);
  });

  it('LOT_HISTORY selecciona historia de SHOW-001 sin movimientos ni trazas irrelevantes', () => {
    const context = build('¿Qué pasó con SHOW-001?');
    expect(context.intent).toBe('LOT_HISTORY');
    expect(context.movements.map((movement) => movement.reference)).toEqual(['SHOWCASE-IMPORT-001', 'SHOWCASE-TRANSFER-001']);
    expect(context.movementItems).toHaveLength(2);
    expect(context.traceability.map((event) => event.id)).toEqual(['trace-show-001']);
    expect(JSON.stringify(context)).not.toContain('IRRELEVANT-999');
    expect(JSON.stringify(context)).not.toContain('trace-other');
  });

  it('la proyección es determinística aunque cambie el orden del snapshot', () => {
    const reversed: PapaStockSnapshot = {
      ...snapshot,
      locations: [...snapshot.locations].reverse(),
      lots: [...snapshot.lots].reverse(),
      stockRecords: [...snapshot.stockRecords].reverse(),
      movements: [...snapshot.movements].reverse(),
      traceabilityEvents: [...snapshot.traceabilityEvents].reverse(),
    };
    expect(build('¿Qué pasó con SHOW-001?', reversed)).toEqual(build('¿Qué pasó con SHOW-001?'));
  });

  it('el fallback general queda acotado y no vuelve al snapshot completo', () => {
    const context = build('Dame un resumen operativo general');
    expect(context.intent).toBe('GENERAL');
    expect(context.summary).toMatchObject({ totalLots: 4, totalStockRecords: 6, totalMovements: 6 });
    expect(measureAiOperationsContext(context).counts).toMatchObject({ lots: 0, stockRecords: 0, movements: 0 });
  });
});
