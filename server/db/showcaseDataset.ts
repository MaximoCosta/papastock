import type { PoolClient } from 'pg';
import { buildStockVerificationPreview } from '../../src/lib/stockVerification';
import type { Lot, Movement, StockRecord, StockView } from '../../src/types/domain';
import { buildLotCorrectionPlan } from '../services/lotCorrection';
import { receptionPayloadFingerprint } from '../services/movementReception';
import { verifyLedgerWithClient } from './ledgerAudit';

const SOURCE = 'papastock_showcase';
const LOCK_NAME = 'papastock:showcase-dataset:v1';

type QueryClient = Pick<PoolClient, 'query'>;

const receptionInput = {
  movementId: 'movement-showcase-transfer-001',
  idempotencyKey: 'SHOWCASE-RECEPTION-001',
  date: '2026-08-21',
  items: [{ movementItemId: 'mitem-showcase-transfer-001', receivedQuantity: 2_000 }],
};

export const showcaseManifest = {
  source: SOURCE,
  operations: {
    reception: { ...receptionInput, payloadFingerprint: receptionPayloadFingerprint(receptionInput) },
    correction: { originalMovementId: 'movement-showcase-transfer-001', locationId: 'loc-frig-a', fromLotCode: 'SHOW-001', toLotCode: 'SHOW-002', quantity: 250, unit: 'kg' },
    stockVerification: { stockRecordId: 'stock-showcase-001-oriente-kg', expectedVersion: 1, countedQuantity: 7_900, date: '2026-08-23', notes: 'Conteo físico Showcase', resultingVersion: 2 },
  },
  locations: [
    { id: 'loc-oriente', name: 'Campo Oriente', type: 'warehouse' },
    { id: 'loc-frig-a', name: 'Frigorífico A', type: 'cold_storage' },
  ],
  lots: [
    { id: 'lot-showcase-001', code: 'SHOW-001', variety: 'Spunta', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce, Buenos Aires, Argentina', harvestDate: '2026-08-10', createdAt: '2026-08-18T12:00:00.000Z' },
    { id: 'lot-showcase-002', code: 'SHOW-002', variety: 'Innovator', campaign: '2025/26', producer: 'Papasud', origin: 'Tandil, Buenos Aires, Argentina', harvestDate: '2026-08-11', createdAt: '2026-08-18T12:01:00.000Z' },
    { id: 'lot-showcase-003', code: 'SHOW-003', variety: 'Atlantic', campaign: '2025/26', producer: 'Papasud', origin: 'Balcarce, Buenos Aires, Argentina', harvestDate: '2026-08-12', createdAt: '2026-08-18T12:02:00.000Z' },
  ],
  movements: [
    { id: 'movement-showcase-import-001', reference: 'SHOWCASE-IMPORT-001', lotId: 'lot-showcase-001', originLocationId: null, destinationLocationId: 'loc-oriente', quantity: 10_000, movementDate: '2026-08-18', status: 'completed', remitoNumber: 'SHOW-IMP-001', kind: 'import', correctsMovementId: null, receivedTotal: null, receivedUnit: null, receivedAt: null, receptionStatus: 'not_applicable', receptionIdempotencyKey: null, receptionPayloadFingerprint: null, data: { source: SOURCE, operation: 'initial_import' }, createdAt: '2026-08-18T12:10:00.000Z' },
    { id: 'movement-showcase-import-002', reference: 'SHOWCASE-IMPORT-002', lotId: 'lot-showcase-002', originLocationId: null, destinationLocationId: 'loc-oriente', quantity: 6_000, movementDate: '2026-08-18', status: 'completed', remitoNumber: 'SHOW-IMP-002', kind: 'import', correctsMovementId: null, receivedTotal: null, receivedUnit: null, receivedAt: null, receptionStatus: 'not_applicable', receptionIdempotencyKey: null, receptionPayloadFingerprint: null, data: { source: SOURCE, operation: 'initial_import' }, createdAt: '2026-08-18T12:11:00.000Z' },
    { id: 'movement-showcase-import-003', reference: 'SHOWCASE-IMPORT-003', lotId: 'lot-showcase-003', originLocationId: null, destinationLocationId: 'loc-oriente', quantity: 4_000, movementDate: '2026-08-18', status: 'completed', remitoNumber: 'SHOW-IMP-003', kind: 'import', correctsMovementId: null, receivedTotal: null, receivedUnit: null, receivedAt: null, receptionStatus: 'not_applicable', receptionIdempotencyKey: null, receptionPayloadFingerprint: null, data: { source: SOURCE, operation: 'initial_import' }, createdAt: '2026-08-18T12:12:00.000Z' },
    { id: 'movement-showcase-transfer-001', reference: 'SHOWCASE-TRANSFER-001', lotId: 'lot-showcase-001', originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a', quantity: 2_000, movementDate: '2026-08-20', status: 'completed', remitoNumber: 'SHOW-TR-001', kind: 'transfer', correctsMovementId: null, receivedTotal: null, receivedUnit: null, receivedAt: '2026-08-21T12:00:00.000Z', receptionStatus: 'received', receptionIdempotencyKey: receptionInput.idempotencyKey, receptionPayloadFingerprint: receptionPayloadFingerprint(receptionInput), data: { source: SOURCE, operation: 'transfer', receptionReference: 'SHOWCASE-RECEPTION-001' }, createdAt: '2026-08-20T12:00:00.000Z' },
    { id: 'movement-showcase-transfer-002', reference: 'SHOWCASE-TRANSFER-002', lotId: 'lot-showcase-002', originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a', quantity: 1_000, movementDate: '2026-08-21', status: 'pending', remitoNumber: 'SHOW-TR-002', kind: 'transfer', correctsMovementId: null, receivedTotal: null, receivedUnit: null, receivedAt: null, receptionStatus: 'pending', receptionIdempotencyKey: null, receptionPayloadFingerprint: null, data: { source: SOURCE, operation: 'transfer' }, createdAt: '2026-08-21T13:00:00.000Z' },
    { id: 'movement-showcase-transfer-003', reference: 'SHOWCASE-TRANSFER-003', lotId: 'lot-showcase-003', originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a', quantity: 500, movementDate: '2026-08-22', status: 'cancelled', remitoNumber: 'SHOW-TR-003', kind: 'transfer', correctsMovementId: null, receivedTotal: null, receivedUnit: null, receivedAt: null, receptionStatus: 'not_applicable', receptionIdempotencyKey: null, receptionPayloadFingerprint: null, data: { source: SOURCE, operation: 'transfer' }, createdAt: '2026-08-22T10:00:00.000Z' },
    { id: 'movement-showcase-correction-001', reference: 'SHOWCASE-CORRECTION-001', lotId: null, originLocationId: 'loc-frig-a', destinationLocationId: 'loc-frig-a', quantity: 250, movementDate: '2026-08-22', status: 'completed', remitoNumber: 'SHOW-TR-001', kind: 'correction', correctsMovementId: 'movement-showcase-transfer-001', receivedTotal: null, receivedUnit: null, receivedAt: null, receptionStatus: 'not_applicable', receptionIdempotencyKey: null, receptionPayloadFingerprint: null, data: { source: SOURCE, operation: 'lot_correction', fromLotCode: 'SHOW-001', toLotCode: 'SHOW-002' }, createdAt: '2026-08-22T14:00:00.000Z' },
  ],
  movementItems: [
    { id: 'mitem-showcase-import-001', movementId: 'movement-showcase-import-001', lotId: 'lot-showcase-001', dispatchedQuantity: 10_000, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 0, data: { source: SOURCE }, createdAt: '2026-08-18T12:10:00.000Z' },
    { id: 'mitem-showcase-import-002', movementId: 'movement-showcase-import-002', lotId: 'lot-showcase-002', dispatchedQuantity: 6_000, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 0, data: { source: SOURCE }, createdAt: '2026-08-18T12:11:00.000Z' },
    { id: 'mitem-showcase-import-003', movementId: 'movement-showcase-import-003', lotId: 'lot-showcase-003', dispatchedQuantity: 4_000, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 0, data: { source: SOURCE }, createdAt: '2026-08-18T12:12:00.000Z' },
    { id: 'mitem-showcase-transfer-001', movementId: 'movement-showcase-transfer-001', lotId: 'lot-showcase-001', dispatchedQuantity: 2_000, receivedQuantity: 2_000, receivedAt: '2026-08-21T12:00:00.000Z', unit: 'kg', sortOrder: 0, data: { source: SOURCE }, createdAt: '2026-08-20T12:00:00.000Z' },
    { id: 'mitem-showcase-transfer-002', movementId: 'movement-showcase-transfer-002', lotId: 'lot-showcase-002', dispatchedQuantity: 1_000, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 0, data: { source: SOURCE }, createdAt: '2026-08-21T13:00:00.000Z' },
    { id: 'mitem-showcase-transfer-003', movementId: 'movement-showcase-transfer-003', lotId: 'lot-showcase-003', dispatchedQuantity: 500, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 0, data: { source: SOURCE }, createdAt: '2026-08-22T10:00:00.000Z' },
    { id: 'mitem-showcase-correction-001-restore', movementId: 'movement-showcase-correction-001', lotId: 'lot-showcase-001', dispatchedQuantity: 250, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 0, data: { source: SOURCE, effect: 'restore' }, createdAt: '2026-08-22T14:00:00.000Z' },
    { id: 'mitem-showcase-correction-001-deduct', movementId: 'movement-showcase-correction-001', lotId: 'lot-showcase-002', dispatchedQuantity: 250, receivedQuantity: null, receivedAt: null, unit: 'kg', sortOrder: 1, data: { source: SOURCE, effect: 'deduct' }, createdAt: '2026-08-22T14:00:00.000Z' },
  ],
  stockRecords: [
    { id: 'stock-showcase-001-oriente-kg', lotId: 'lot-showcase-001', locationId: 'loc-oriente', declaredQuantity: 8_000, verifiedQuantity: 7_900, verificationPending: false, updatedAt: '2026-08-23T12:00:00.000Z', unit: 'kg', version: 2 },
    { id: 'stock-showcase-001-frig-a-kg', lotId: 'lot-showcase-001', locationId: 'loc-frig-a', declaredQuantity: 2_250, verifiedQuantity: 2_250, verificationPending: false, updatedAt: '2026-08-22T14:00:00.000Z', unit: 'kg', version: 1 },
    { id: 'stock-showcase-002-oriente-kg', lotId: 'lot-showcase-002', locationId: 'loc-oriente', declaredQuantity: 5_000, verifiedQuantity: 5_000, verificationPending: false, updatedAt: '2026-08-21T13:00:00.000Z', unit: 'kg', version: 1 },
    { id: 'stock-showcase-002-frig-a-kg', lotId: 'lot-showcase-002', locationId: 'loc-frig-a', declaredQuantity: 750, verifiedQuantity: 750, verificationPending: false, updatedAt: '2026-08-22T14:00:00.000Z', unit: 'kg', version: 1 },
    { id: 'stock-showcase-003-oriente-kg', lotId: 'lot-showcase-003', locationId: 'loc-oriente', declaredQuantity: 4_000, verifiedQuantity: 4_000, verificationPending: true, updatedAt: '2026-08-18T12:12:00.000Z', unit: 'kg', version: 0 },
  ],
  traceabilityEvents: [
    { id: 'trace-showcase-correction-001-restore', lotId: 'lot-showcase-001', eventType: 'correction', eventDate: '2026-08-22', locationId: 'loc-frig-a', data: { source: SOURCE, reference: 'SHOWCASE-CORRECTION-001', corrects: 'SHOWCASE-TRANSFER-001', remitoNumber: 'SHOW-TR-001', quantity: 250, unit: 'kg', fromLotCode: 'SHOW-001', toLotCode: 'SHOW-002' }, createdAt: '2026-08-22T14:00:00.000Z' },
    { id: 'trace-showcase-correction-001-deduct', lotId: 'lot-showcase-002', eventType: 'correction', eventDate: '2026-08-22', locationId: 'loc-frig-a', data: { source: SOURCE, reference: 'SHOWCASE-CORRECTION-001', corrects: 'SHOWCASE-TRANSFER-001', remitoNumber: 'SHOW-TR-001', quantity: 250, unit: 'kg', fromLotCode: 'SHOW-001', toLotCode: 'SHOW-002' }, createdAt: '2026-08-22T14:00:01.000Z' },
    { id: 'trace-showcase-verification-001', lotId: 'lot-showcase-001', eventType: 'stock_verification', eventDate: '2026-08-23', locationId: 'loc-oriente', data: { source: SOURCE, verifiedQuantity: 7_900, notes: 'Conteo físico Showcase', origin: 'operator_confirmation' }, createdAt: '2026-08-23T12:00:00.000Z' },
  ],
} as const;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

function assertExact(label: string, actual: unknown, expected: unknown): void {
  if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected))) {
    throw new Error(`Drift detectado en ${label}; el Showcase no será reparado automáticamente.`);
  }
}

function assertDomainPlans(): void {
  const lots: Lot[] = showcaseManifest.lots.map((row) => ({
    id: row.id, code: row.code, variety: row.variety, campaign: row.campaign,
    producer: row.producer, origin: row.origin, harvestDate: row.harvestDate,
  }));
  const original: Movement = {
    id: 'movement-showcase-transfer-001', reference: 'SHOWCASE-TRANSFER-001',
    originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a',
    date: '2026-08-20', status: 'completed', kind: 'transfer', receptionStatus: 'received',
    items: [{ id: 'mitem-showcase-transfer-001', movementId: 'movement-showcase-transfer-001', lotId: 'lot-showcase-001', dispatchedQuantity: 2_000, receivedQuantity: 2_000, unit: 'kg', sortOrder: 0 }],
  };
  const correctionStock: StockRecord[] = [
    { id: 'pre-correction-show-001', lotId: 'lot-showcase-001', locationId: 'loc-frig-a', declaredQuantity: 2_000, verifiedQuantity: 2_000, updatedAt: '2026-08-22T13:59:00.000Z', unit: 'kg' },
    { id: 'pre-correction-show-002', lotId: 'lot-showcase-002', locationId: 'loc-frig-a', declaredQuantity: 1_000, verifiedQuantity: 1_000, updatedAt: '2026-08-22T13:59:00.000Z', unit: 'kg' },
  ];
  const correction = buildLotCorrectionPlan(showcaseManifest.operations.correction, original, lots, correctionStock);
  if (!correction.valid) throw new Error('El plan productivo de corrección rechazó el manifiesto Showcase.');

  const verificationRecord: StockView = {
    id: 'stock-showcase-001-oriente-kg', lotId: 'lot-showcase-001', locationId: 'loc-oriente',
    declaredQuantity: 8_000, verifiedQuantity: 8_000, verificationPending: true,
    updatedAt: '2026-08-23T11:59:00.000Z', unit: 'kg', version: 1,
    lot: lots[0], location: showcaseManifest.locations[0], difference: 0, status: 'pending',
  };
  const verification = buildStockVerificationPreview(showcaseManifest.operations.stockVerification, [verificationRecord]);
  if (!verification.valid
    || verificationRecord.version !== showcaseManifest.operations.stockVerification.expectedVersion
    || showcaseManifest.operations.stockVerification.resultingVersion !== showcaseManifest.operations.stockVerification.expectedVersion + 1) {
    throw new Error('El plan productivo de verificación rechazó el manifiesto Showcase.');
  }
}

async function readCurrent(client: QueryClient) {
  const lotIds = showcaseManifest.lots.map((row) => row.id);
  const lotCodes = showcaseManifest.lots.map((row) => row.code);
  const movementIds = showcaseManifest.movements.map((row) => row.id);
  const references = showcaseManifest.movements.map((row) => row.reference);
  const itemIds = showcaseManifest.movementItems.map((row) => row.id);
  const stockIds = showcaseManifest.stockRecords.map((row) => row.id);
  const traceIds = showcaseManifest.traceabilityEvents.map((row) => row.id);
  // A PoolClient executes one query at a time; keeping these sequential also avoids
  // depending on pg's deprecated implicit query queue.
  const lots = await client.query(`select id, code, variety, campaign, producer, origin, to_char(harvest_date, 'YYYY-MM-DD') as "harvestDate", to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt" from public.lots where id = any($1::text[]) or code = any($2::text[]) order by id`, [lotIds, lotCodes]);
  const movements = await client.query(`select id, reference, lot_id as "lotId", origin_location_id as "originLocationId", destination_location_id as "destinationLocationId", quantity::float8 as quantity, to_char(movement_date, 'YYYY-MM-DD') as "movementDate", status, remito_number as "remitoNumber", kind, corrects_movement_id as "correctsMovementId", received_total::float8 as "receivedTotal", received_unit as "receivedUnit", to_char(received_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "receivedAt", reception_status as "receptionStatus", reception_idempotency_key as "receptionIdempotencyKey", reception_payload_fingerprint as "receptionPayloadFingerprint", data, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt" from public.movements where id = any($1::text[]) or reference = any($2::text[]) or data->>'source' = $3 order by id`, [movementIds, references, SOURCE]);
  const items = await client.query(`select id, movement_id as "movementId", lot_id as "lotId", dispatched_quantity::float8 as "dispatchedQuantity", received_quantity::float8 as "receivedQuantity", to_char(received_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "receivedAt", unit, sort_order as "sortOrder", data, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt" from public.movement_items where id = any($1::text[]) or data->>'source' = $2 order by id`, [itemIds, SOURCE]);
  const stock = await client.query(`select id, lot_id as "lotId", location_id as "locationId", declared_quantity::float8 as "declaredQuantity", verified_quantity::float8 as "verifiedQuantity", verification_pending as "verificationPending", to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt", unit, version from public.stock_records where id = any($1::text[]) or lot_id = any($2::text[]) order by id`, [stockIds, lotIds]);
  const traces = await client.query(`select id, lot_id as "lotId", event_type as "eventType", to_char(event_date, 'YYYY-MM-DD') as "eventDate", location_id as "locationId", data, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt" from public.traceability_events where id = any($1::text[]) or data->>'source' = $2 order by id`, [traceIds, SOURCE]);
  return { lots: lots.rows, movements: movements.rows, movementItems: items.rows, stockRecords: stock.rows, traceabilityEvents: traces.rows };
}

async function assertLocations(client: QueryClient): Promise<void> {
  const result = await client.query('select id, name, type from public.locations where id = any($1::text[]) order by id', [showcaseManifest.locations.map((row) => row.id)]);
  assertExact('locations reutilizadas', result.rows, [...showcaseManifest.locations].sort((a, b) => a.id.localeCompare(b.id)));
}

async function insertManifest(client: QueryClient): Promise<void> {
  for (const row of showcaseManifest.lots) {
    await client.query('insert into public.lots (id, code, variety, campaign, producer, origin, harvest_date, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)', [row.id, row.code, row.variety, row.campaign, row.producer, row.origin, row.harvestDate, row.createdAt]);
  }
  for (const row of showcaseManifest.movements) {
    await client.query(`insert into public.movements (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, remito_number, kind, corrects_movement_id, received_total, received_unit, received_at, reception_status, reception_idempotency_key, reception_payload_fingerprint, data, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19)`, [row.id, row.reference, row.lotId, row.originLocationId, row.destinationLocationId, row.quantity, row.movementDate, row.status, row.remitoNumber, row.kind, row.correctsMovementId, row.receivedTotal, row.receivedUnit, row.receivedAt, row.receptionStatus, row.receptionIdempotencyKey, row.receptionPayloadFingerprint, JSON.stringify(row.data), row.createdAt]);
  }
  for (const row of showcaseManifest.movementItems) {
    await client.query(`insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, received_quantity, received_at, unit, sort_order, data, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`, [row.id, row.movementId, row.lotId, row.dispatchedQuantity, row.receivedQuantity, row.receivedAt, row.unit, row.sortOrder, JSON.stringify(row.data), row.createdAt]);
  }
  for (const row of showcaseManifest.stockRecords) {
    await client.query(`insert into public.stock_records (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit, version) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [row.id, row.lotId, row.locationId, row.declaredQuantity, row.verifiedQuantity, row.verificationPending, row.updatedAt, row.unit, row.version]);
  }
  for (const row of showcaseManifest.traceabilityEvents) {
    await client.query(`insert into public.traceability_events (id, lot_id, event_type, event_date, location_id, data, created_at) values ($1,$2,$3,$4,$5,$6::jsonb,$7)`, [row.id, row.lotId, row.eventType, row.eventDate, row.locationId, JSON.stringify(row.data), row.createdAt]);
  }
}

export interface ShowcaseDatasetResult {
  created: boolean;
  showcaseCoordinates: Awaited<ReturnType<typeof verifyLedgerWithClient>>['coordinates'];
}

export async function applyShowcaseDataset(client: QueryClient): Promise<ShowcaseDatasetResult> {
  assertDomainPlans();
  await client.query('begin');
  try {
    await client.query('select pg_advisory_xact_lock(hashtext($1))', [LOCK_NAME]);
    await assertLocations(client);
    const before = await readCurrent(client);
    const existingCount = Object.values(before).reduce((total, rows) => total + rows.length, 0);
    const expectedCount = showcaseManifest.lots.length + showcaseManifest.movements.length + showcaseManifest.movementItems.length + showcaseManifest.stockRecords.length + showcaseManifest.traceabilityEvents.length;
    if (existingCount !== 0 && existingCount !== expectedCount) {
      throw new Error('Drift parcial detectado: existe sólo una parte del Showcase. No se realizaron cambios.');
    }
    if (existingCount === 0) await insertManifest(client);

    const current = await readCurrent(client);
    assertExact('lots', current.lots, [...showcaseManifest.lots].sort((a, b) => a.id.localeCompare(b.id)));
    assertExact('movements', current.movements, [...showcaseManifest.movements].sort((a, b) => a.id.localeCompare(b.id)));
    assertExact('movement_items', current.movementItems, [...showcaseManifest.movementItems].sort((a, b) => a.id.localeCompare(b.id)));
    assertExact('stock_records', current.stockRecords, [...showcaseManifest.stockRecords].sort((a, b) => a.id.localeCompare(b.id)));
    assertExact('traceability_events', current.traceabilityEvents, [...showcaseManifest.traceabilityEvents].sort((a, b) => a.id.localeCompare(b.id)));

    const ledger = await verifyLedgerWithClient(client);
    const lotIds = new Set<string>(showcaseManifest.lots.map((row) => row.id));
    const showcaseCoordinates = ledger.coordinates.filter((row) => lotIds.has(row.lotId));
    if (ledger.blockingIssues.length !== 0 || showcaseCoordinates.length !== showcaseManifest.stockRecords.length || showcaseCoordinates.some((row) => row.classification !== 'MATCH')) {
      throw new Error('LedgerVerifier rechazó el Showcase; la transacción fue revertida.');
    }
    await client.query('commit');
    return { created: existingCount === 0, showcaseCoordinates };
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}
