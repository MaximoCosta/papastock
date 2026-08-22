export type LocationType = 'cold_storage' | 'warehouse';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
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

