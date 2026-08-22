import type { LocationType, MovementStatus, TraceabilityEventType } from './domain';

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
}

export interface MovementRow {
  id: string;
  reference: string;
  lot_id: string;
  origin_location_id: string | null;
  destination_location_id: string | null;
  quantity: number | string;
  movement_date: string;
  status: MovementStatus;
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
