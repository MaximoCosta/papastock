import { movementPrimaryLotId } from '../../src/lib/movements';
import { stockUnit } from '../../src/lib/quantity';
import type {
  Discrepancy,
  Location,
  Lot,
  Movement,
  MovementItem,
  Shelf,
  ShelfUnit,
  StockCount,
  StockRecord,
  TraceabilityEvent,
  Transporter,
} from '../../src/types/domain';
import type {
  DiscrepancyRow,
  LocationRow,
  LotRow,
  MovementItemRow,
  MovementRow,
  ShelfRow,
  ShelfUnitRow,
  StockCountRow,
  StockRecordRow,
  TraceabilityEventRow,
  TransporterRow,
} from '../../src/types/database';

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
  unit: stockUnit(row),
  version: Number(row.version ?? 0),
  shelfId: row.shelf_id ?? undefined,
});

export const mapMovementItem = (row: MovementItemRow): MovementItem => ({
  id: row.id,
  movementId: row.movement_id,
  lotId: row.lot_id,
  dispatchedQuantity: Number(row.dispatched_quantity),
  receivedQuantity: row.received_quantity == null ? undefined : Number(row.received_quantity),
  receivedAt: row.received_at ?? undefined,
  unit: row.unit,
  sortOrder: row.sort_order,
  data: row.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data : undefined,
});

export const mapMovement = (row: MovementRow, items: MovementItem[] = []): Movement => {
  const data = row.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data : undefined;
  const entries = data ? Object.entries(data).filter(([, value]) => value !== undefined) : [];
  const mapped: Movement = {
    id: row.id,
    reference: row.reference,
    lotId: row.lot_id ?? undefined,
    originLocationId: row.origin_location_id ?? undefined,
    destinationLocationId: row.destination_location_id ?? undefined,
    quantity: row.quantity == null ? undefined : Number(row.quantity),
    date: row.movement_date,
    status: row.status,
    remitoNumber: row.remito_number ?? undefined,
    kind: row.kind ?? 'transfer',
    correctsMovementId: row.corrects_movement_id ?? undefined,
    receptionStatus: row.reception_status ?? 'not_applicable',
    receivedTotal: row.received_total == null ? undefined : Number(row.received_total),
    receivedUnit: row.received_unit ?? undefined,
    receivedAt: row.received_at ?? undefined,
    data: entries.length > 0 ? Object.fromEntries(entries) : undefined,
    items,
  };
  if (!mapped.lotId) mapped.lotId = movementPrimaryLotId(mapped) || undefined;
  if (mapped.quantity == null && items.length === 1) mapped.quantity = items[0].dispatchedQuantity;
  return mapped;
};

export const mapTraceabilityEvent = (row: TraceabilityEventRow): TraceabilityEvent => ({
  id: row.id,
  lotId: row.lot_id,
  type: row.event_type,
  date: row.event_date,
  locationId: row.location_id ?? undefined,
  data: typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data) ? row.data : {},
});

export const mapDiscrepancy = (row: DiscrepancyRow): Discrepancy => ({
  id: row.id,
  movementId: row.movement_id ?? undefined,
  movementItemId: row.movement_item_id ?? undefined,
  stockRecordId: row.stock_record_id ?? undefined,
  lotId: row.lot_id ?? undefined,
  locationId: row.location_id ?? undefined,
  type: row.type,
  expectedQuantity: Number(row.expected_quantity),
  observedQuantity: Number(row.observed_quantity),
  unit: row.unit,
  difference: Number(row.difference),
  status: row.status,
  cause: row.cause ?? undefined,
  resolution: row.resolution ?? undefined,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at ?? undefined,
});

export const mapStockCount = (row: StockCountRow): StockCount => ({
  id: row.id,
  locationId: row.location_id,
  lotId: row.lot_id,
  expectedQuantity: Number(row.expected_quantity),
  observedQuantity: Number(row.observed_quantity),
  unit: row.unit,
  difference: Number(row.observed_quantity) - Number(row.expected_quantity),
  countedAt: row.counted_at,
  notes: row.notes ?? undefined,
  discrepancyId: row.discrepancy_id ?? undefined,
});

export const mapTransporter = (row: TransporterRow): Transporter => ({
  id: row.id,
  companyName: row.company_name,
  tradeName: row.trade_name ?? undefined,
  cuit: row.cuit,
  contactName: row.contact_name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  city: row.city,
  province: row.province,
  licensePlate: row.license_plate,
  vehicleType: row.vehicle_type,
  capacityKg: Number(row.capacity_kg),
  insurancePolicy: row.insurance_policy ?? undefined,
  notes: row.notes ?? undefined,
  active: row.active,
});

export const mapShelfUnit = (row: ShelfUnitRow): ShelfUnit => ({
  id: row.id,
  locationId: row.location_id,
  code: row.code,
  label: row.label,
  gridRow: row.grid_row,
  gridCol: row.grid_col,
});

export const mapShelf = (row: ShelfRow): Shelf => ({
  id: row.id,
  locationId: row.location_id,
  shelfUnitId: row.shelf_unit_id,
  code: row.code,
  label: row.label,
  level: row.level,
  capacityKg: row.capacity_kg == null ? undefined : Number(row.capacity_kg),
});
