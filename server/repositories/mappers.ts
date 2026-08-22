import type { Location, Lot, Movement, StockRecord, TraceabilityEvent } from '../../src/types/domain';
import type { LocationRow, LotRow, MovementRow, StockRecordRow, TraceabilityEventRow } from '../../src/types/database';

export const mapLocation = (row: LocationRow): Location => ({ id: row.id, name: row.name, type: row.type });

export const mapLot = (row: LotRow): Lot => ({
  id: row.id,
  code: row.code,
  variety: row.variety,
  campaign: row.campaign,
  producer: row.producer,
  origin: row.origin,
  harvestDate: row.harvest_date ?? undefined,
});

export const mapStockRecord = (row: StockRecordRow): StockRecord => ({
  id: row.id,
  lotId: row.lot_id,
  locationId: row.location_id,
  declaredQuantity: Number(row.declared_quantity),
  verifiedQuantity: Number(row.verified_quantity),
  verificationPending: row.verification_pending,
  updatedAt: row.updated_at,
});

export const mapMovement = (row: MovementRow): Movement => ({
  id: row.id,
  reference: row.reference,
  lotId: row.lot_id,
  originLocationId: row.origin_location_id ?? undefined,
  destinationLocationId: row.destination_location_id ?? undefined,
  quantity: Number(row.quantity),
  date: row.movement_date,
  status: row.status,
});

export const mapTraceabilityEvent = (row: TraceabilityEventRow): TraceabilityEvent => ({
  id: row.id,
  lotId: row.lot_id,
  type: row.event_type,
  date: row.event_date,
  locationId: row.location_id ?? undefined,
  data: typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data) ? row.data : {},
});
