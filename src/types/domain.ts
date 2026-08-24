export type LocationType = 'cold_storage' | 'warehouse';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  capacityKg?: number;
  temperatureC?: number;
}

/** Estantería física posicionada en el plano del depósito. */
export interface ShelfUnit {
  id: string;
  locationId: string;
  code: string;
  label: string;
  gridRow: number;
  gridCol: number;
}

/** Estante (nivel) dentro de una estantería. */
export interface Shelf {
  id: string;
  locationId: string;
  shelfUnitId: string;
  code: string;
  label: string;
  level: number;
  capacityKg?: number;
}

export interface Lot {
  id: string;
  code: string;
  variety: string;
  campaign: string;
  producer: string;
  origin: string;
  harvestDate?: string;
}

export type QuantityUnit = 'kg' | 'bags';

export interface StockRecord {
  id: string;
  lotId: string;
  locationId: string;
  shelfId?: string;
  declaredQuantity: number;
  verifiedQuantity: number;
  updatedAt: string;
  verificationPending?: boolean;
  unit?: QuantityUnit;
  version?: number;
}

export type MovementStatus = 'completed' | 'pending' | 'cancelled';
export type MovementKind = 'transfer' | 'correction' | 'import' | 'opening_balance';
export type ReceptionStatus = 'not_applicable' | 'pending' | 'received' | 'needs_reconciliation';
export type DiscrepancyStatus = 'open' | 'investigating' | 'resolved';
export type DiscrepancyType = 'reception_shortfall' | 'reception_unallocated' | 'physical_count';
export type StockAlertKind = 'discrepancy' | 'low_stock' | 'depleted' | 'insufficient_for_movement';

export interface MovementItem {
  id: string;
  movementId: string;
  lotId: string;
  dispatchedQuantity: number;
  receivedQuantity?: number;
  receivedAt?: string;
  unit: QuantityUnit;
  sortOrder: number;
  data?: Record<string, unknown>;
}

export interface Movement {
  id: string;
  /** Legacy: first item lot, kept so existing N02/UI readers keep working. */
  lotId?: string;
  originLocationId?: string;
  destinationLocationId?: string;
  /** Legacy header quantity. Prefer items[]. */
  quantity?: number;
  date: string;
  status: MovementStatus;
  reference: string;
  remitoNumber?: string;
  kind?: MovementKind;
  correctsMovementId?: string;
  receptionStatus?: ReceptionStatus;
  receivedTotal?: number;
  receivedUnit?: QuantityUnit;
  receivedAt?: string;
  transporterId?: string;
  data?: Record<string, unknown>;
  items?: MovementItem[];
}

export interface Discrepancy {
  id: string;
  movementId?: string;
  movementItemId?: string;
  stockRecordId?: string;
  lotId?: string;
  locationId?: string;
  type: DiscrepancyType;
  expectedQuantity: number;
  observedQuantity: number;
  unit: QuantityUnit;
  difference: number;
  status: DiscrepancyStatus;
  cause?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface StockCount {
  id: string;
  locationId: string;
  lotId: string;
  expectedQuantity: number;
  observedQuantity: number;
  unit: QuantityUnit;
  difference: number;
  countedAt: string;
  notes?: string;
  discrepancyId?: string;
}

export type PlanillaMovementKind = 'inbound' | 'transfer' | 'outbound';

export interface PlanillaImportRow {
  sheet: string;
  rowNumber: number;
  remito?: string;
  date: string;
  lotCode: string;
  variety: string;
  quantityKg: number;
  originName: string;
  destinationName: string;
  transporter?: string;
  bags?: number;
  caliber?: string;
  category?: string;
  notes?: string;
  dtv?: string;
  client?: string;
  bagColor?: string;
  threadColor?: string;
  averageKg?: number;
  kind: PlanillaMovementKind;
  reference: string;
}

export interface StockIntakeInput {
  lotCode: string;
  variety: string;
  quantityKg: number;
  date: string;
  destination: string;
  origin?: string;
  remito?: string;
  bags?: number;
  averageKg?: number;
  caliber?: string;
  category?: string;
  bagColor?: string;
  threadColor?: string;
  transporter?: string;
  client?: string;
  dtv?: string;
  notes?: string;
  campaign?: string;
  producer?: string;
}

export interface StockVerificationInput {
  stockRecordId: string;
  expectedVersion: number;
  countedQuantity: number;
  date: string;
  bags?: number;
  notes?: string;
}

export interface StockVerificationPreview {
  valid: boolean;
  issues: PlanillaImportIssue[];
  stockRecordId: string;
  expectedVersion: number;
  lotId: string;
  lotCode: string;
  variety: string;
  locationId: string;
  locationName: string;
  declaredQuantity: number;
  previousVerified: number;
  countedQuantity: number;
  difference: number;
  verificationPending: boolean;
  date: string;
  bags?: number;
  notes?: string;
}

export interface StockVerificationConfirmation {
  persisted: boolean;
  correction: StockControlCorrection;
  event: TraceabilityEvent;
}

export interface PlanillaImportIssue {
  sheet: string;
  rowNumber: number;
  code: string;
  message: string;
}

export interface PlanillaSheetSummary {
  name: string;
  imported: number;
  skipped: number;
}

export interface PlanillaImportPreview {
  fileName: string;
  movementCount: number;
  totalKg: number;
  sample: PlanillaImportRow[];
  sheets: PlanillaSheetSummary[];
  skippedSheets: string[];
  issues: PlanillaImportIssue[];
  newLocations: Array<{ name: string; type: LocationType }>;
  newLots: Array<{ code: string; variety: string }>;
  existingLocations: string[];
  existingLots: string[];
  valid: boolean;
}

export interface PlanillaImportResult {
  createdLocations: number;
  createdLots: number;
  createdMovements: number;
  skippedMovements: number;
  upsertedStockRecords: number;
  persisted?: boolean;
}

export interface PlanillaImportConfirmation extends PlanillaImportResult {
  persisted: boolean;
  applied: {
    locations: Location[];
    lots: Lot[];
    stockRecords: StockRecord[];
    movements: Movement[];
  };
}

export interface Transporter {
  id: string;
  companyName: string;
  tradeName?: string;
  cuit: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  licensePlate: string;
  vehicleType: string;
  capacityKg: number;
  insurancePolicy?: string;
  notes?: string;
  active: boolean;
}

export type TraceabilityEventType =
  | 'planting'
  | 'harvest'
  | 'treatment'
  | 'quality_control'
  | 'stock_verification'
  | 'reception'
  | 'correction'
  | 'physical_count'
  | 'discrepancy';

export interface TraceabilityEvent {
  id: string;
  lotId: string;
  type: TraceabilityEventType;
  date: string;
  locationId?: string;
  data: Record<string, unknown>;
}

export type StockStatus = 'verified' | 'discrepancy' | 'pending';

export interface StockView extends StockRecord {
  lot: Lot;
  location: Location;
  difference: number;
  status: StockStatus;
}

export interface StockControlCorrection {
  stockRecordId: string;
  lotCode: string;
  countedQuantity: number;
  previousVerified: number;
  newVersion?: number;
  notes?: string;
}

export interface ValidationError {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface MovementIntentItem {
  lotCode: string;
  quantity: number;
  unit: QuantityUnit;
}

export interface MovementIntent {
  action: 'transfer';
  remitoNumber?: string;
  origin: string;
  destination: string;
  items: MovementIntentItem[];
  /** Convenience for single-item kg transfers / legacy clients. */
  lotCode?: string;
  quantityKg?: number;
}

export interface MovementInterpretation extends MovementIntent {
  engine: 'llm' | 'heuristic';
}

export interface StockTransferLinePreview {
  lotCode: string;
  quantity: number;
  unit: QuantityUnit;
  lot?: Lot;
  originStock?: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>;
  destinationStock?: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>;
  originAfter?: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>;
  destinationAfter?: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>;
}

export interface StockTransferPreview extends ValidationResult {
  intent: MovementIntent;
  remitoNumber?: string;
  origin?: Location;
  destination?: Location;
  lines: StockTransferLinePreview[];
  lot?: Lot;
  originStock?: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>;
}

export interface MovementReceptionInput {
  movementId: string;
  idempotencyKey: string;
  date: string;
  items?: Array<{ movementItemId: string; receivedQuantity: number }>;
  receivedTotal?: number;
  unit?: QuantityUnit;
}

export interface LotReallocationInput {
  originalMovementId: string;
  locationId: string;
  fromLotCode: string;
  toLotCode: string;
  quantity: number;
  unit: QuantityUnit;
}

export interface StockCountInput {
  locationId?: string;
  location?: string;
  lotId?: string;
  lotCode?: string;
  observedQuantity: number;
  unit: QuantityUnit;
  date: string;
  notes?: string;
}
