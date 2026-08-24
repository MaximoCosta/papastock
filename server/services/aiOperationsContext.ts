import { stockUnit } from '../../src/lib/quantity';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { verifyLedgerAuthority } from './ledgerVerifier';

export type AiOperationsIntent =
  | 'LOT_STOCK'
  | 'LOT_LOCATION'
  | 'PENDING_VERIFICATION'
  | 'PENDING_RECEPTION'
  | 'LEDGER_AUTHORITY'
  | 'LOT_HISTORY'
  | 'GENERAL';

const CONTEXT_LIMITS = {
  lots: 250,
  locations: 50,
  stockRecords: 1_000,
  movements: 750,
  movementItems: 2_500,
  traceability: 2_000,
  discrepancies: 1_000,
  stockCounts: 1_000,
} as const;

const GENERAL_SELECTION_LIMITS = {
  lots: 20,
  locations: 20,
  stockRecords: 50,
  movements: 30,
  movementItems: 60,
  traceability: 50,
  discrepancies: 30,
  stockCounts: 30,
  ledgerClassifications: 50,
} as const;

function assertWithinLimit(name: keyof typeof CONTEXT_LIMITS, count: number): void {
  if (count > CONTEXT_LIMITS[name]) {
    throw Object.assign(new Error(`El contexto ${name} supera el límite seguro.`), { status: 413 });
  }
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function containsEntity(question: string, candidate: string): boolean {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) return false;
  const escaped = normalizedCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(question);
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function takeBounded<T>(items: T[], limit: number, name: string): T[] {
  if (items.length > limit) {
    throw Object.assign(new Error(`La proyección general ${name} supera el límite seguro.`), { status: 413 });
  }
  return items;
}

function safeTraceabilityData(data: Record<string, unknown>): Record<string, string | number | boolean> {
  const allowed = new Set([
    'product', 'cause', 'source', 'origin', 'expectedQuantity', 'verifiedQuantity',
    'difference', 'unit', 'movementReference', 'receivedQuantity', 'countedQuantity',
  ]);
  return Object.fromEntries(Object.entries(data).filter(([key, value]) =>
    allowed.has(key) && ['string', 'number', 'boolean'].includes(typeof value),
  )) as Record<string, string | number | boolean>;
}

function classifyIntent(
  normalizedQuestion: string,
  mentionedLotIds: Set<string>,
): AiOperationsIntent {
  if (/\bledger\b/.test(normalizedQuestion) && /autoritat|complet/.test(normalizedQuestion)) return 'LEDGER_AUTHORITY';
  if (/verific/.test(normalizedQuestion) && /pendient/.test(normalizedQuestion)) return 'PENDING_VERIFICATION';
  if (/recep/.test(normalizedQuestion) && /pendient/.test(normalizedQuestion)) return 'PENDING_RECEPTION';
  if (mentionedLotIds.size > 0 && /(que paso|histori|trazabil)/.test(normalizedQuestion)) return 'LOT_HISTORY';
  if (mentionedLotIds.size > 0 && /(donde|ubicac)/.test(normalizedQuestion)) return 'LOT_LOCATION';
  if (mentionedLotIds.size > 0 && /(stock|saldo|cantidad|cuanto (?:hay|queda))/.test(normalizedQuestion)) return 'LOT_STOCK';
  return 'GENERAL';
}

export function buildAiOperationsContext(
  questionOrSnapshot: string | PapaStockSnapshot,
  snapshotOrTimestamp?: PapaStockSnapshot | string,
  timestamp = new Date().toISOString(),
) {
  const legacyCall = typeof questionOrSnapshot !== 'string';
  const snapshot = legacyCall ? questionOrSnapshot : snapshotOrTimestamp as PapaStockSnapshot;
  const question = legacyCall
    ? `historia completa ${snapshot.lots.map((lot) => lot.code).join(' ')}`
    : questionOrSnapshot;
  const effectiveTimestamp = legacyCall && typeof snapshotOrTimestamp === 'string'
    ? snapshotOrTimestamp
    : timestamp;
  const normalizedQuestion = normalize(question);
  const allLots = [...snapshot.lots]
    .map(({ id, code, variety, campaign, producer, origin, harvestDate }) => ({
      id, code, variety, campaign, producer, origin, harvestDate,
    }))
    .sort(byId);
  const allLocations = [...snapshot.locations]
    .map(({ id, name, type }) => ({ id, name, type }))
    .sort(byId);
  const allStockRecords = [...snapshot.stockRecords]
    .map((record) => ({
      id: record.id,
      lotId: record.lotId,
      locationId: record.locationId,
      declaredQuantity: record.declaredQuantity,
      verifiedQuantity: record.verifiedQuantity,
      verificationPending: Boolean(record.verificationPending),
      unit: stockUnit(record),
      updatedAt: record.updatedAt,
    }))
    .sort(byId);
  const allMovements = [...snapshot.movements]
    .map((movement) => ({
      id: movement.id,
      reference: movement.reference,
      kind: movement.kind ?? 'transfer',
      status: movement.status,
      lotId: movement.lotId,
      quantity: movement.quantity,
      date: movement.date,
      originLocationId: movement.originLocationId,
      destinationLocationId: movement.destinationLocationId,
      receptionStatus: movement.receptionStatus ?? 'not_applicable',
      receivedTotal: movement.receivedTotal,
      receivedUnit: movement.receivedUnit,
      receivedAt: movement.receivedAt,
      correctsMovementId: movement.correctsMovementId,
    }))
    .sort(byId);
  const allMovementItems = snapshot.movements
    .flatMap((movement) => (movement.items ?? []).map((item) => ({
      id: item.id,
      movementId: movement.id,
      lotId: item.lotId,
      quantity: item.dispatchedQuantity,
      receivedQuantity: item.receivedQuantity,
      receivedAt: item.receivedAt,
      unit: item.unit,
      data: item.data?.effect ? { effect: item.data.effect } : undefined,
    })))
    .sort(byId);
  const allTraceability = snapshot.traceabilityEvents
    .map((event) => ({
      id: event.id,
      lotId: event.lotId,
      type: event.type,
      date: event.date,
      locationId: event.locationId,
      data: safeTraceabilityData(event.data),
    }))
    .sort(byId);
  const allDiscrepancies = (snapshot.discrepancies ?? [])
    .map((item) => ({
      id: item.id,
      lotId: item.lotId,
      locationId: item.locationId,
      movementId: item.movementId,
      type: item.type,
      expectedQuantity: item.expectedQuantity,
      observedQuantity: item.observedQuantity,
      difference: item.difference,
      unit: item.unit,
      status: item.status,
      cause: item.cause,
    }))
    .sort(byId);
  const allStockCounts = (snapshot.stockCounts ?? [])
    .map((item) => ({
      id: item.id,
      lotId: item.lotId,
      locationId: item.locationId,
      expectedQuantity: item.expectedQuantity,
      observedQuantity: item.observedQuantity,
      difference: item.difference,
      unit: item.unit,
      countedAt: item.countedAt,
    }))
    .sort(byId);

  assertWithinLimit('lots', allLots.length);
  assertWithinLimit('locations', allLocations.length);
  assertWithinLimit('stockRecords', allStockRecords.length);
  assertWithinLimit('movements', allMovements.length);
  assertWithinLimit('movementItems', allMovementItems.length);
  assertWithinLimit('traceability', allTraceability.length);
  assertWithinLimit('discrepancies', allDiscrepancies.length);
  assertWithinLimit('stockCounts', allStockCounts.length);

  const ledger = verifyLedgerAuthority({
    lots: allLots.map(({ id, code }) => ({ id, code })),
    locations: allLocations.map(({ id, name }) => ({ id, name })),
    movements: allMovements.map((movement) => ({
      id: movement.id,
      reference: movement.reference,
      kind: movement.kind,
      status: movement.status,
      lotId: movement.lotId,
      quantity: movement.quantity,
      originLocationId: movement.originLocationId,
      destinationLocationId: movement.destinationLocationId,
      correctsMovementId: movement.correctsMovementId,
    })),
    movementItems: allMovementItems,
    stockRecords: allStockRecords.map((record) => ({
      id: record.id,
      lotId: record.lotId,
      locationId: record.locationId,
      unit: record.unit,
      declaredQuantity: record.declaredQuantity,
      verifiedQuantity: record.verifiedQuantity,
      verificationPending: record.verificationPending,
    })),
  });

  const mentionedLotIds = new Set(allLots
    .filter((lot) => containsEntity(normalizedQuestion, lot.code) || containsEntity(normalizedQuestion, lot.id))
    .map((lot) => lot.id));
  const mentionedLocationIds = new Set(allLocations
    .filter((location) => containsEntity(normalizedQuestion, location.name) || containsEntity(normalizedQuestion, location.id))
    .map((location) => location.id));
  const mentionedMovementIds = new Set(allMovements
    .filter((movement) => containsEntity(normalizedQuestion, movement.reference) || containsEntity(normalizedQuestion, movement.id))
    .map((movement) => movement.id));
  const intent = classifyIntent(normalizedQuestion, mentionedLotIds);

  let selectedLotIds = new Set(mentionedLotIds);
  let selectedLocationIds = new Set(mentionedLocationIds);
  let selectedMovementIds = new Set(mentionedMovementIds);
  let stockRecords = allStockRecords.filter((record) => selectedLotIds.has(record.lotId) || selectedLocationIds.has(record.locationId));
  let movementItems = allMovementItems.filter((item) => selectedMovementIds.has(item.movementId));
  let traceability = allTraceability.filter((event) => selectedLotIds.has(event.lotId));
  let discrepancies = allDiscrepancies.filter((item) => (item.lotId && selectedLotIds.has(item.lotId))
    || (item.movementId && selectedMovementIds.has(item.movementId)));
  let stockCounts = allStockCounts.filter((item) => selectedLotIds.has(item.lotId));

  if (intent === 'PENDING_VERIFICATION') {
    stockRecords = allStockRecords.filter((record) => record.verificationPending);
    selectedLotIds = new Set(stockRecords.map((record) => record.lotId));
    selectedLocationIds = new Set(stockRecords.map((record) => record.locationId));
    selectedMovementIds = new Set();
    movementItems = [];
    traceability = [];
    discrepancies = [];
    stockCounts = [];
  } else if (intent === 'PENDING_RECEPTION') {
    selectedMovementIds = new Set(allMovements
      .filter((movement) => movement.receptionStatus === 'pending' || movement.receptionStatus === 'needs_reconciliation')
      .map((movement) => movement.id));
    movementItems = allMovementItems.filter((item) => selectedMovementIds.has(item.movementId));
    selectedLotIds = new Set(movementItems.map((item) => item.lotId));
    selectedLocationIds = new Set(allMovements
      .filter((movement) => selectedMovementIds.has(movement.id))
      .flatMap((movement) => [movement.originLocationId, movement.destinationLocationId].filter((id): id is string => Boolean(id))));
    stockRecords = [];
    traceability = [];
    discrepancies = allDiscrepancies.filter((item) => item.movementId && selectedMovementIds.has(item.movementId));
    stockCounts = [];
  } else if (intent === 'LEDGER_AUTHORITY') {
    selectedLotIds = new Set();
    selectedLocationIds = new Set();
    selectedMovementIds = new Set();
    stockRecords = [];
    movementItems = [];
    traceability = [];
    discrepancies = [];
    stockCounts = [];
  } else if (intent === 'LOT_STOCK' || intent === 'LOT_LOCATION') {
    stockRecords = allStockRecords.filter((record) => selectedLotIds.has(record.lotId));
    selectedLocationIds = new Set(stockRecords.map((record) => record.locationId));
    selectedMovementIds = new Set();
    movementItems = [];
    traceability = [];
    discrepancies = [];
    stockCounts = [];
  } else if (intent === 'LOT_HISTORY') {
    const directMovementIds = new Set(allMovementItems
      .filter((item) => selectedLotIds.has(item.lotId))
      .map((item) => item.movementId));
    for (const movement of allMovements) {
      if (movement.correctsMovementId && directMovementIds.has(movement.correctsMovementId)) directMovementIds.add(movement.id);
      if (movement.correctsMovementId && directMovementIds.has(movement.id)) directMovementIds.add(movement.correctsMovementId);
    }
    selectedMovementIds = directMovementIds;
    movementItems = allMovementItems.filter((item) => selectedMovementIds.has(item.movementId) && selectedLotIds.has(item.lotId));
    stockRecords = allStockRecords.filter((record) => selectedLotIds.has(record.lotId));
    traceability = allTraceability.filter((event) => selectedLotIds.has(event.lotId));
    discrepancies = allDiscrepancies.filter((item) => (item.lotId && selectedLotIds.has(item.lotId))
      || (item.movementId && selectedMovementIds.has(item.movementId)));
    stockCounts = allStockCounts.filter((item) => selectedLotIds.has(item.lotId));
    selectedLocationIds = new Set([
      ...stockRecords.map((record) => record.locationId),
      ...traceability.map((event) => event.locationId).filter((id): id is string => Boolean(id)),
      ...allMovements.filter((movement) => selectedMovementIds.has(movement.id))
        .flatMap((movement) => [movement.originLocationId, movement.destinationLocationId].filter((id): id is string => Boolean(id))),
    ]);
  } else {
    movementItems = allMovementItems.filter((item) => selectedMovementIds.has(item.movementId));
    for (const item of movementItems) selectedLotIds.add(item.lotId);
    stockRecords = allStockRecords.filter((record) => selectedLotIds.has(record.lotId) || selectedLocationIds.has(record.locationId));
    for (const record of stockRecords) {
      selectedLotIds.add(record.lotId);
      selectedLocationIds.add(record.locationId);
    }
    for (const movement of allMovements.filter((item) => selectedMovementIds.has(item.id))) {
      if (movement.originLocationId) selectedLocationIds.add(movement.originLocationId);
      if (movement.destinationLocationId) selectedLocationIds.add(movement.destinationLocationId);
    }
    traceability = allTraceability.filter((event) => selectedLotIds.has(event.lotId));
    discrepancies = allDiscrepancies.filter((item) => (item.lotId && selectedLotIds.has(item.lotId))
      || (item.movementId && selectedMovementIds.has(item.movementId)));
    stockCounts = allStockCounts.filter((item) => selectedLotIds.has(item.lotId));
  }

  const movements = allMovements.filter((movement) => selectedMovementIds.has(movement.id));
  const lots = allLots.filter((lot) => selectedLotIds.has(lot.id));
  const locations = allLocations.filter((location) => selectedLocationIds.has(location.id));
  const selectedCoordinateKeys = new Set(stockRecords.map((record) => `${record.lotId}\u0000${record.locationId}\u0000${record.unit}`));
  const ledgerClassifications = intent === 'LEDGER_AUTHORITY'
    ? []
    : ledger.coordinates.filter((coordinate) => selectedLotIds.has(coordinate.lotId)
      || selectedCoordinateKeys.has(`${coordinate.lotId}\u0000${coordinate.locationId}\u0000${coordinate.unit}`));

  if (intent === 'GENERAL') {
    takeBounded(lots, GENERAL_SELECTION_LIMITS.lots, 'lots');
    takeBounded(locations, GENERAL_SELECTION_LIMITS.locations, 'locations');
    takeBounded(stockRecords, GENERAL_SELECTION_LIMITS.stockRecords, 'stockRecords');
    takeBounded(movements, GENERAL_SELECTION_LIMITS.movements, 'movements');
    takeBounded(movementItems, GENERAL_SELECTION_LIMITS.movementItems, 'movementItems');
    takeBounded(traceability, GENERAL_SELECTION_LIMITS.traceability, 'traceability');
    takeBounded(discrepancies, GENERAL_SELECTION_LIMITS.discrepancies, 'discrepancies');
    takeBounded(stockCounts, GENERAL_SELECTION_LIMITS.stockCounts, 'stockCounts');
    takeBounded(ledgerClassifications, GENERAL_SELECTION_LIMITS.ledgerClassifications, 'ledgerClassifications');
  }

  return {
    timestamp: effectiveTimestamp,
    intent,
    summary: {
      totalLots: allLots.length,
      totalLocations: allLocations.length,
      totalStockRecords: allStockRecords.length,
      totalMovements: allMovements.length,
      pendingVerification: allStockRecords.filter((record) => record.verificationPending).length,
      pendingReception: allMovements.filter((movement) => movement.receptionStatus === 'pending'
        || movement.receptionStatus === 'needs_reconciliation').length,
    },
    lots,
    locations,
    stockRecords,
    movements,
    movementItems,
    traceability,
    discrepancies,
    stockCounts,
    ledger: {
      ledgerAuthority: ledger.ledgerAuthority,
      classifications: ledgerClassifications,
      blockingIssues: ledger.blockingIssues.length,
      classificationCounts: ledger.classificationCounts,
    },
  };
}

export type AiOperationsContext = ReturnType<typeof buildAiOperationsContext>;

export function measureAiOperationsContext(context: AiOperationsContext) {
  const contextBytes = Buffer.byteLength(JSON.stringify(context), 'utf8');
  return {
    intent: context.intent,
    contextBytes,
    jsonBytes: contextBytes,
    estimatedInputTokens: Math.ceil(contextBytes / 4),
    counts: {
      lots: context.lots.length,
      locations: context.locations.length,
      stockRecords: context.stockRecords.length,
      movements: context.movements.length,
      movementItems: context.movementItems.length,
      traceability: context.traceability.length,
      discrepancies: context.discrepancies.length,
      stockCounts: context.stockCounts.length,
      ledgerClassifications: context.ledger.classifications.length,
      ledgerBlockingIssues: context.ledger.blockingIssues,
    },
  };
}
