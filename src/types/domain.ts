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

export interface StockRecord {
  id: string;
  lotId: string;
  locationId: string;
  shelfId?: string;
  declaredQuantity: number;
  verifiedQuantity: number;
  updatedAt: string;
  verificationPending?: boolean;
}

export type MovementStatus = 'completed' | 'pending' | 'cancelled';

export interface Movement {
  id: string;
  lotId: string;
  originLocationId?: string;
  destinationLocationId?: string;
  quantity: number;
  date: string;
  status: MovementStatus;
  reference: string;
  transporterId?: string;
  data?: Record<string, unknown>;
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
  countedQuantity: number;
  date: string;
  bags?: number;
  notes?: string;
}

export interface StockVerificationPreview {
  valid: boolean;
  issues: PlanillaImportIssue[];
  stockRecordId: string;
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
  | 'stock_verification';

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

export interface MovementIntent {
  action: 'transfer';
  lotCode: string;
  quantityKg: number;
  origin: string;
  destination: string;
}

export interface MovementInterpretation extends MovementIntent {
  engine: 'llm' | 'heuristic';
}

export interface StockTransferPreview extends ValidationResult {
  intent: MovementIntent;
  lot?: Lot;
  origin?: Location;
  destination?: Location;
  originStock?: Pick<StockRecord, 'declaredQuantity' | 'verifiedQuantity'>;
}
