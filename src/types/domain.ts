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
