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

export interface GeneratedDocument {
  id: string;
  operationId: string;
  createdAt: string;
  exporter: string;
  lotCode: string;
  variety: string;
  quantity: number;
  origin: string;
  destinationCountry: string;
  treatment: string;
  campaign: string;
}
