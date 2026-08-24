import type {
  DiscrepancyStatus,
  DiscrepancyType,
  LocationType,
  MovementKind,
  MovementStatus,
  QuantityUnit,
  ReceptionStatus,
  TraceabilityEventType,
} from './domain';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface LocationRow {
  id: string;
  name: string;
  type: LocationType;
  created_at: string;
}

export interface LotRow {
  id: string;
  code: string;
  variety: string;
  campaign: string;
  producer: string;
  origin: string;
  harvest_date: string | null;
  created_at: string;
}

export interface StockRecordRow {
  id: string;
  lot_id: string;
  location_id: string;
  declared_quantity: number | string;
  verified_quantity: number | string;
  verification_pending: boolean;
  updated_at: string;
  unit?: QuantityUnit | null;
  version?: number | string;
}

export interface MovementRow {
  id: string;
  reference: string;
  lot_id: string | null;
  origin_location_id: string | null;
  destination_location_id: string | null;
  quantity: number | string | null;
  movement_date: string;
  status: MovementStatus;
  created_at: string;
  data?: Json;
  remito_number?: string | null;
  kind?: MovementKind | null;
  corrects_movement_id?: string | null;
  received_total?: number | string | null;
  received_unit?: QuantityUnit | null;
  received_at?: string | null;
  reception_status?: ReceptionStatus | null;
  reception_idempotency_key?: string | null;
  reception_payload_fingerprint?: string | null;
}

export interface MovementItemRow {
  id: string;
  movement_id: string;
  lot_id: string;
  dispatched_quantity: number | string;
  received_quantity: number | string | null;
  received_at: string | null;
  unit: QuantityUnit;
  sort_order: number;
  data?: Json;
  created_at: string;
}

export interface DiscrepancyRow {
  id: string;
  movement_id: string | null;
  movement_item_id: string | null;
  stock_record_id: string | null;
  lot_id: string | null;
  location_id: string | null;
  type: DiscrepancyType;
  expected_quantity: number | string;
  observed_quantity: number | string;
  unit: QuantityUnit;
  difference: number | string;
  status: DiscrepancyStatus;
  cause: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface StockCountRow {
  id: string;
  location_id: string;
  lot_id: string;
  expected_quantity: number | string;
  observed_quantity: number | string;
  unit: QuantityUnit;
  counted_at: string;
  notes: string | null;
  discrepancy_id: string | null;
  created_at: string;
}

export interface TraceabilityEventRow {
  id: string;
  lot_id: string;
  event_type: TraceabilityEventType;
  event_date: string;
  location_id: string | null;
  data: Json;
  created_at: string;
}
