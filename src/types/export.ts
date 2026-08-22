import type { Lot, TraceabilityEvent } from './domain';

export type ExportField = 'lotCode' | 'variety' | 'quantity' | 'origin' | 'treatment';
export type RequirementStatus = 'complete' | 'missing' | 'pending';
export type ExportStatus = 'draft' | 'incomplete' | 'ready' | 'generated';

export interface ExportRequirement {
  id: string;
  country: string;
  documentType: string;
  field: ExportField;
  label: string;
  required: boolean;
  source?: string;
}

export interface ExportOperation {
  id: string;
  lotId: string;
  destinationCountry: string;
  quantity: number;
  status: ExportStatus;
  createdAt: string;
  transporterId?: string;
  buyerName?: string;
  incoterm?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  notes?: string;
}

export interface ExportValidationInput {
  lot?: Lot;
  destinationCountry: string;
  quantity: number;
  traceabilityEvents: TraceabilityEvent[];
  requirements: ExportRequirement[];
}

export interface RequirementResult {
  field: ExportField;
  label: string;
  status: RequirementStatus;
  value?: string;
}

export interface ExportValidationResult {
  valid: boolean;
  completedFields: ExportField[];
  missingFields: ExportField[];
  requirements: RequirementResult[];
}

export interface ParsedTraceabilityEvent {
  type: 'treatment';
  date: string;
  product: string;
  sourceText: string;
}

export type AnalysisEngine = 'llm' | 'heuristic';

export interface DiscrepancyHypothesis {
  title: string;
  explanation: string;
  movementReferences: string[];
}

export interface DiscrepancyEvidence {
  type: 'movement' | 'traceability' | 'stock';
  reference: string;
  description: string;
}

export interface DiscrepancyAnalysis {
  engine: AnalysisEngine;
  summary: string;
  confidence: number;
  explainedQuantity: number;
  unexplainedQuantity: number;
  hypotheses: DiscrepancyHypothesis[];
  evidence: DiscrepancyEvidence[];
  recommendedAction: string;
  relatedMovementId?: string;
  relatedMovementReference?: string;
}

export type DocumentType = 'proforma' | 'factura' | 'remito' | 'planilla_stock' | 'planilla_conteo';

interface GeneratedDocumentBase {
  id: string;
  createdAt: string;
}

export interface ProformaDocument extends GeneratedDocumentBase {
  type: 'proforma';
  operationId: string;
  exporter: string;
  lotCode: string;
  variety: string;
  quantity: number;
  origin: string;
  destinationCountry: string;
  treatment: string;
  campaign: string;
  buyerName?: string;
  incoterm?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  transporterName?: string;
  transporterCuit?: string;
  transporterPlate?: string;
  transporterVehicle?: string;
}

export interface FacturaDocument extends GeneratedDocumentBase {
  type: 'factura';
  operationId: string;
  exporter: string;
  lotCode: string;
  variety: string;
  quantity: number;
  destinationCountry: string;
  unitPrice: number;
  currency: string;
  campaign: string;
  buyerName?: string;
  incoterm?: string;
  transporterName?: string;
}

export interface RemitoDocument extends GeneratedDocumentBase {
  type: 'remito';
  lotCode: string;
  variety: string;
  quantity: number;
  originLocation: string;
  destinationLocation: string;
  transporter: string;
  dispatchReference: string;
  transporterCuit?: string;
  transporterPlate?: string;
  transporterVehicle?: string;
  transporterContact?: string;
  transporterPhone?: string;
}

export interface PlanillaStockRow {
  lotCode: string;
  variety: string;
  location: string;
  declaredQuantity: number;
  verifiedQuantity: number;
  difference: number;
  status: string;
  verificationPending: boolean;
}

export interface PlanillaStockDocument extends GeneratedDocumentBase {
  type: 'planilla_stock';
  scope: string;
  rows: PlanillaStockRow[];
}

export interface PlanillaConteoRow {
  stockRecordId: string;
  lotCode: string;
  variety: string;
  location: string;
  shelfCode: string;
  declaredQuantity: number;
  systemVerified: number;
  verificationPending: boolean;
}

export interface PlanillaConteoDocument extends GeneratedDocumentBase {
  type: 'planilla_conteo';
  scope: string;
  rows: PlanillaConteoRow[];
}

export type GeneratedDocument =
  | ProformaDocument
  | FacturaDocument
  | RemitoDocument
  | PlanillaStockDocument
  | PlanillaConteoDocument;
