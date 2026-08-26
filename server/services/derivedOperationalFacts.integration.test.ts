import { describe, expect, it } from 'vitest';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { Movement, MovementItem, TraceabilityEvent } from '../../src/types/domain';
import { showcaseManifest } from '../db/showcaseDataset';
import { buildAiOperationsContext } from './aiOperationsContext';

/** Snapshot operativo del Showcase, derivado del manifiesto canónico versionado. */
function showcaseOperationsSnapshot(): PapaStockSnapshot {
  const itemsByMovement = new Map<string, MovementItem[]>();
  for (const row of showcaseManifest.movementItems) {
    const items = itemsByMovement.get(row.movementId) ?? [];
    items.push({
      id: row.id,
      movementId: row.movementId,
      lotId: row.lotId,
      dispatchedQuantity: row.dispatchedQuantity,
      receivedQuantity: row.receivedQuantity ?? undefined,
      receivedAt: row.receivedAt ?? undefined,
      unit: row.unit,
      sortOrder: row.sortOrder,
      data: { ...row.data },
    });
    itemsByMovement.set(row.movementId, items);
  }
  const movements: Movement[] = showcaseManifest.movements.map((row) => ({
    id: row.id,
    reference: row.reference,
    lotId: row.lotId ?? undefined,
    originLocationId: row.originLocationId ?? undefined,
    destinationLocationId: row.destinationLocationId ?? undefined,
    quantity: row.quantity,
    date: row.movementDate,
    status: row.status,
    remitoNumber: row.remitoNumber ?? undefined,
    kind: row.kind,
    correctsMovementId: row.correctsMovementId ?? undefined,
    receptionStatus: row.receptionStatus,
    items: itemsByMovement.get(row.id) ?? [],
  }));
  const traceabilityEvents: TraceabilityEvent[] = showcaseManifest.traceabilityEvents.map((row) => ({
    id: row.id,
    lotId: row.lotId,
    type: row.eventType,
    date: row.eventDate,
    locationId: row.locationId,
    data: { ...row.data },
  }));

  return {
    locations: showcaseManifest.locations.map((row) => ({ ...row })),
    shelfUnits: [], shelves: [], transporters: [],
    lots: showcaseManifest.lots.map((row) => ({
      id: row.id, code: row.code, variety: row.variety, campaign: row.campaign,
      producer: row.producer, origin: row.origin, harvestDate: row.harvestDate,
    })),
    stockRecords: showcaseManifest.stockRecords.map((row) => ({ ...row })),
    movements,
    traceabilityEvents,
    discrepancies: [],
    stockCounts: [],
  };
}

/**
 * A-204 reproduce `migrations/seed.sql`: es el segundo caso real y la base de la
 * próxima fase. Los valores salen del seed, pero los hechos los deriva el motor genérico.
 */
function seedSnapshotA204(): PapaStockSnapshot {
  return {
    locations: [
      { id: 'loc-north', name: 'Frigorífico Norte', type: 'cold_storage' },
      { id: 'loc-south', name: 'Frigorífico Sur', type: 'cold_storage' },
      { id: 'loc-warehouse', name: 'Galpón Principal', type: 'warehouse' },
    ],
    shelfUnits: [], shelves: [], transporters: [],
    lots: [
      { id: 'lot-a204', code: 'A-204', variety: 'Innovator', campaign: '2025/26', producer: 'Establecimiento El Ombú', origin: 'Balcarce' },
    ],
    stockRecords: [
      {
        id: 'stock-a204', lotId: 'lot-a204', locationId: 'loc-south',
        declaredQuantity: 25_000, verifiedQuantity: 24_000, verificationPending: false,
        unit: 'kg', updatedAt: '2026-08-21T10:30:00-03:00',
      },
    ],
    movements: [
      {
        id: 'movement-1032', reference: 'MV-1032', originLocationId: 'loc-north', destinationLocationId: 'loc-south',
        quantity: 1_000, date: '2026-08-20', status: 'pending', kind: 'transfer', receptionStatus: 'not_applicable',
        items: [{ id: 'mitem-movement-1032', movementId: 'movement-1032', lotId: 'lot-a204', dispatchedQuantity: 1_000, unit: 'kg', sortOrder: 0 }],
      },
      {
        id: 'movement-1028', reference: 'MV-1028', originLocationId: 'loc-warehouse', destinationLocationId: 'loc-south',
        quantity: 8_000, date: '2026-08-18', status: 'completed', kind: 'transfer', receptionStatus: 'not_applicable',
        items: [{ id: 'mitem-movement-1028', movementId: 'movement-1028', lotId: 'lot-a204', dispatchedQuantity: 8_000, unit: 'kg', sortOrder: 0 }],
      },
    ],
    traceabilityEvents: [
      { id: 'trace-a204-harvest', lotId: 'lot-a204', type: 'harvest', date: '2026-07-20', data: { netWeight: 25_000 } },
      { id: 'trace-a204-verify', lotId: 'lot-a204', type: 'stock_verification', date: '2026-08-21', locationId: 'loc-south', data: { verifiedQuantity: 24_000 } },
    ],
    discrepancies: [], stockCounts: [],
  };
}

describe('derived facts en el contexto LOT_HISTORY · SHOW-001', () => {
  const context = buildAiOperationsContext(
    '¿Qué pasó con SHOW-001?', showcaseOperationsSnapshot(), '2026-08-24T12:00:00.000Z',
  );

  it('adjunta hechos derivados sólo en LOT_HISTORY', () => {
    expect(context.intent).toBe('LOT_HISTORY');
    expect(context.derivedFacts).not.toBeNull();
    const stock = buildAiOperationsContext('¿Cuánto stock tiene SHOW-001?', showcaseOperationsSnapshot());
    expect(stock.intent).toBe('LOT_STOCK');
    expect(stock.derivedFacts).toBeNull();
  });

  it('reporta el stock canónico -100 kg', () => {
    expect(context.derivedFacts?.stock[0]).toMatchObject({
      lotCode: 'SHOW-001', declared: 10_250, verified: 10_150, difference: -100, hasDiscrepancy: true,
    });
  });

  it('detecta el movimiento multi-lote que el contexto crudo no puede mostrar', () => {
    // La proyección recorta movementItems al lote consultado: en crudo la corrección
    // aparece con una sola línea. El hecho derivado ve el padrón completo.
    const rawItemsForCorrection = context.movementItems
      .filter((item) => item.movementId === 'movement-showcase-correction-001');
    expect(rawItemsForCorrection).toHaveLength(1);

    const fact = context.derivedFacts?.movements
      .find((item) => item.movementId === 'movement-showcase-correction-001');
    expect(fact).toMatchObject({
      itemCount: 2, lotCount: 2, multipleLots: true, lotQuantity: 250, movementQuantity: 500,
    });
  });

  it('conserva MATCH junto a la diferencia verificada', () => {
    const oriente = context.derivedFacts?.ledger.find((fact) => fact.locationId === 'loc-oriente');
    expect(oriente).toMatchObject({ status: 'MATCH', reconciles: true, verifiedDifference: -100 });
  });

  it('todo recordId de provenance existe en el contexto crudo', () => {
    const stockIds = new Set(context.stockRecords.map((record) => record.id));
    const refs = (context.derivedFacts?.stock ?? [])
      .flatMap((fact) => fact.locations)
      .flatMap((location) => location.sources);

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(ref.source).toBe('stock_records');
      expect(stockIds).toContain(ref.recordId);
    }
  });

  it('toda clave de hecho es citable contra el contexto crudo', () => {
    const movementIds = new Set(context.movements.map((movement) => movement.id));
    const eventIds = new Set(context.traceability.map((event) => event.id));

    for (const fact of context.derivedFacts?.movements ?? []) {
      expect(movementIds).toContain(fact.movementId);
    }
    for (const fact of context.derivedFacts?.traceability ?? []) {
      expect(eventIds).toContain(fact.eventId);
    }
    for (const fact of context.derivedFacts?.temporal ?? []) {
      expect(movementIds).toContain(fact.movementId);
      expect(eventIds).toContain(fact.eventId);
    }
  });

  it('rechaza un recordId inventado: ninguno cae fuera del contexto', () => {
    const known = new Set([
      ...context.stockRecords.map((record) => record.id),
      ...context.movements.map((movement) => movement.id),
      ...context.traceability.map((event) => event.id),
    ]);
    expect(known.has('stock-inventado-999')).toBe(false);

    const emitted = [
      ...(context.derivedFacts?.stock ?? []).flatMap((fact) => fact.locations)
        .flatMap((location) => location.sources.map((ref) => ref.recordId)),
      ...(context.derivedFacts?.movements ?? []).map((fact) => fact.movementId),
      ...(context.derivedFacts?.traceability ?? []).map((fact) => fact.eventId),
    ];
    // `null` es legítimo (hecho sin fila única); cualquier string DEBE existir en el contexto.
    expect(emitted.every((id) => id === null || known.has(id))).toBe(true);
  });
});

describe('derived facts en el contexto LOT_HISTORY · A-204', () => {
  const context = buildAiOperationsContext(
    '¿Qué pasó con A-204?', seedSnapshotA204(), '2026-08-24T12:00:00.000Z',
  );

  it('deriva la diferencia de -1000 kg en Frigorífico Sur', () => {
    expect(context.intent).toBe('LOT_HISTORY');
    expect(context.derivedFacts?.stock[0]).toMatchObject({
      lotCode: 'A-204', unit: 'kg',
      declared: 25_000, verified: 24_000, difference: -1_000, hasDiscrepancy: true,
    });
    expect(context.derivedFacts?.stock[0].locations).toEqual([
      expect.objectContaining({
        locationLabel: 'Frigorífico Sur', declared: 25_000, verified: 24_000, difference: -1_000,
        sources: [{ source: 'stock_records', recordId: 'stock-a204' }],
      }),
    ]);
  });

  it('MV-1032 involucra un solo lote según los datos actuales', () => {
    const fact = context.derivedFacts?.movements.find((item) => item.movementId === 'movement-1032');
    expect(fact).toMatchObject({
      occurredAt: '2026-08-20',
      itemCount: 1, lotCount: 1, multipleLots: false,
      lotQuantity: 1_000, movementQuantity: 1_000, unit: 'kg',
    });
  });

  it('ubica MV-1032 antes de la verificación, sin afirmar causalidad', () => {
    expect(context.derivedFacts?.temporal).toEqual(expect.arrayContaining([
      { movementId: 'movement-1032', eventId: 'trace-a204-verify', relation: 'before' },
    ]));
  });

  it('el ledger de A-204 no reconcilia: no es un MATCH como SHOW-001', () => {
    const south = context.derivedFacts?.ledger.find((fact) => fact.locationId === 'loc-south');
    expect(south).toMatchObject({
      status: 'MISSING_LEDGER_BALANCE',
      reconciles: false,
      declared: 25_000,
      reconstructed: 9_000,
      verified: 24_000,
      verifiedDifference: -1_000,
    });
  });
});
