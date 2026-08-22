import type { Lot, TraceabilityEvent } from './domain';

export type ExportField = 'lotCode' | 'variety' | 'quantity' | 'origin' | 'treatment';
export type RequirementStatus = 'complete' | 'missing' | 'pending';
export type ExportStatus = 'draft' | 'incomplete' | 'ready' | 'generated';

/**
 * Vocabulario controlado de campos documentales. El LLM sólo puede devolver
 * claves de esta lista: cualquier otra invalida la respuesta y activa el fallback.
 * `ExportField` es el subconjunto que `validateExport` sabe resolver hoy.
 */
export const EXPORT_FIELD_KEYS = [
  'lotCode',
  'variety',
  'campaign',
  'producer',
  'origin',
  'harvestDate',
  'quantity',
  'treatment',
  'destination',
  'customer',
  'incoterm',
  'departurePort',
  'destinationPort',
  'transport',
] as const;

export type ExportFieldKey = (typeof EXPORT_FIELD_KEYS)[number];

/** Distingue requisitos de demo de requisitos interpretados por IA. Nunca son normativa oficial. */
export type RequirementOrigin = 'STATIC_DEMO' | 'AI_PARSED';

export interface ExportRequirement {
  id: string;
  country: string;
  documentType: string;
  field: ExportField;
  label: string;
  required: boolean;
  source?: string;
  origin?: RequirementOrigin;
}

export interface ExportOperation {
  id: string;
  items: ExportLotLine[];
  destinationCountry: string;
  quantity: number;
  status: ExportStatus;
  createdAt: string;
  transporterId?: string;
  buyerName?: string;
  buyerTaxId?: string;
  buyerAddress?: string;
  buyerCity?: string;
  incoterm?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  notes?: string;
  paymentTerms?: string;
  validityDays?: number;
  unitPrice?: number;
  currency?: string;
  bagWeightKg?: number;
  packaging?: string;
  caliber?: string;
  category?: string;
  hsCode?: string;
}

/** Una línea trazable dentro de una exportación. No se agrupan lotes distintos. */
export interface ExportLotLine {
  lotId: string;
  quantity: number;
}

export interface ExportValidationLine extends ExportLotLine {
  lot?: Lot;
  verifiedQuantity?: number;
  stockLocationName?: string;
}

export interface ExportValidationInput {
  /** Forma canónica para exportaciones con uno o más lotes. */
  lines?: ExportValidationLine[];
  /** Campos heredados para consumidores de una exportación de un solo lote. */
  lot?: Lot;
  destinationCountry: string;
  quantity?: number;
  traceabilityEvents: TraceabilityEvent[];
  requirements: ExportRequirement[];
  /** Opcional: habilita la procedencia "Stock verificado" en el checklist. */
  verifiedQuantity?: number;
  /** Opcional: nombre de la ubicación del stock, sólo para procedencia. */
  stockLocationName?: string;
}

/** De dónde salió el valor de un requisito. Se muestra en el checklist. */
export interface RequirementSource {
  label: string;
  detail?: string;
}

export interface RequirementResult {
  lotId?: string;
  field: ExportField;
  label: string;
  status: RequirementStatus;
  value?: string;
  origin: RequirementOrigin;
  source?: RequirementSource;
}

export interface ExportValidationResult {
  valid: boolean;
  completedFields: ExportField[];
  missingFields: ExportField[];
  requirements: RequirementResult[];
}

export type AnalysisEngine = 'llm' | 'heuristic';

/**
 * Intención de trazabilidad interpretada desde texto libre.
 * `product` y `date` son nulos cuando el texto no los contiene: no se inventan.
 */
export interface TraceabilityIntent {
  engine: AnalysisEngine;
  type: 'treatment';
  product: string | null;
  date: string | null;
  confidence: number;
}

export interface ParsedTraceabilityEvent {
  type: 'treatment';
  date: string | null;
  product: string | null;
  sourceText: string;
  engine: AnalysisEngine;
  confidence: number;
}

/** Resultado de la revisión humana: acá producto y fecha ya no pueden faltar. */
export interface ConfirmedTraceabilityEvent {
  type: 'treatment';
  date: string;
  product: string;
  sourceText: string;
  engine: AnalysisEngine;
  confidence: number;
}

export interface AiExportRequirement {
  key: ExportFieldKey;
  label: string;
  required: boolean;
}

export interface AiExportRequirementsResult {
  engine: AnalysisEngine;
  requirements: AiExportRequirement[];
}

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

export type DocumentType = 'proforma' | 'factura' | 'remito' | 'lista_empaque' | 'planilla_stock' | 'planilla_conteo';

/** Campos comerciales y de carga compartidos por los documentos de una operación. */
export interface DocumentCommercialFields {
  producer?: string;
  harvestDate?: string;
  qualityResult?: string;
  bagCount?: number;
  bagWeightKg?: number;
  packaging?: string;
  caliber?: string;
  category?: string;
  hsCode?: string;
  netWeightKg?: number;
  grossWeightKg?: number;
  tareKg?: number;
  lastBagKg?: number;
  packingHomogeneous?: boolean;
  unitPrice?: number;
  currency?: string;
  paymentTerms?: string;
  validityDays?: number;
  validUntil?: string;
  buyerTaxId?: string;
  buyerAddress?: string;
  buyerCity?: string;
  notes?: string;
  originLocation?: string;
  exporterTaxId?: string;
  exporterAddress?: string;
  exporterCity?: string;
  exporterPhone?: string;
  exporterSenasa?: string;
  shippingMarks?: string;
  treatmentDate?: string;
}

export interface DocumentSnapshotRequirement {
  field: string;
  label: string;
  status: RequirementStatus;
  value?: string;
  sourceLabel?: string;
  origin: RequirementOrigin;
}

export interface DocumentSnapshotTraceability {
  id: string;
  type: string;
  date: string;
  summary: string;
}

/**
 * Copia congelada de los valores usados al emitir un documento.
 * Un documento emitido no debe reconstruirse leyendo datos actuales que pudieron cambiar.
 * Es también la forma del payload que persistirá `generated_documents` cuando exista.
 */
export interface DocumentSnapshot {
  generatedAt: string;
  sourceOfTruth: 'database' | 'mock';
  exportOperation: ExportOperation;
  lots: Array<{
    id: string;
    code: string;
    variety: string;
    campaign: string;
    producer: string;
    origin: string;
    harvestDate?: string;
  }>;
  logistics: {
    buyerName?: string;
    buyerTaxId?: string;
    buyerAddress?: string;
    buyerCity?: string;
    incoterm?: string;
    departurePort?: string;
    arrivalPort?: string;
    departureDate?: string;
    notes?: string;
    transporterId?: string;
    transporterName?: string;
    transporterCuit?: string;
    transporterPlate?: string;
    originLocation?: string;
    paymentTerms?: string;
    validityDays?: number;
    unitPrice?: number;
    currency?: string;
    bagCount?: number;
    bagWeightKg?: number;
    packaging?: string;
    caliber?: string;
    category?: string;
    hsCode?: string;
    netWeightKg?: number;
    grossWeightKg?: number;
    shippingMarks?: string;
  };
  requirements: DocumentSnapshotRequirement[];
  traceability: DocumentSnapshotTraceability[];
}

interface GeneratedDocumentBase {
  id: string;
  createdAt: string;
}

export interface ProformaDocument extends GeneratedDocumentBase, DocumentCommercialFields {
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
  items: ExportDocumentItem[];
  buyerName?: string;
  incoterm?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  transporterName?: string;
  transporterCuit?: string;
  transporterPlate?: string;
  transporterVehicle?: string;
  snapshot?: DocumentSnapshot;
}

export interface FacturaDocument extends GeneratedDocumentBase, DocumentCommercialFields {
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
  items: ExportDocumentItem[];
  buyerName?: string;
  incoterm?: string;
  transporterName?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  origin?: string;
  treatment?: string;
  snapshot?: DocumentSnapshot;
}

export interface RemitoDocument extends GeneratedDocumentBase, DocumentCommercialFields {
  type: 'remito';
  operationId?: string;
  lotCode: string;
  variety: string;
  quantity: number;
  items: ExportDocumentItem[];
  originLocation: string;
  destinationLocation: string;
  transporter: string;
  dispatchReference: string;
  transporterCuit?: string;
  transporterPlate?: string;
  transporterVehicle?: string;
  transporterContact?: string;
  transporterPhone?: string;
  campaign?: string;
  origin?: string;
  destinationCountry?: string;
  snapshot?: DocumentSnapshot;
}

export interface ListaEmpaqueDocument extends GeneratedDocumentBase, DocumentCommercialFields {
  type: 'lista_empaque';
  operationId: string;
  exporter: string;
  lotCode: string;
  variety: string;
  quantity: number;
  origin: string;
  destinationCountry: string;
  campaign: string;
  items: ExportDocumentItem[];
  buyerName?: string;
  destinationLocation?: string;
  transporterName?: string;
  transporterPlate?: string;
  transporterVehicle?: string;
  snapshot?: DocumentSnapshot;
}

export interface ExportDocumentItem {
  lotId: string;
  lotCode: string;
  variety: string;
  campaign: string;
  origin: string;
  producer?: string;
  harvestDate?: string;
  quantity: number;
  treatment?: string;
  treatmentDate?: string;
  qualityResult?: string;
  bagCount?: number;
  lastBagKg?: number;
  packingHomogeneous?: boolean;
  unitPrice?: number;
  lineTotal?: number;
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
  | ListaEmpaqueDocument
  | PlanillaStockDocument
  | PlanillaConteoDocument;

export function documentOperationId(document: GeneratedDocument): string | undefined {
  return 'operationId' in document ? document.operationId : undefined;
}

// ---------------------------------------------------------------------------
// Contratos previstos para el backend. Todavía no existe ningún endpoint que
// los implemente: están acá para que la persistencia se construya contra una
// forma acordada y N03 no tenga que cambiar cuando llegue.
// ---------------------------------------------------------------------------

export interface CreateExportOperationRequest {
  items: Array<{ lotId: string; quantityKg: number }>;
  destinationCountry: string;
  customer?: string;
  customerTaxId?: string;
  incoterm?: string;
  departurePort?: string;
  destinationPort?: string;
  departureDate?: string;
  transporterId?: string;
  notes?: string;
  paymentTerms?: string;
  unitPrice?: number;
  currency?: string;
  bagWeightKg?: number;
  packaging?: string;
  caliber?: string;
  category?: string;
  hsCode?: string;
}

export interface ExportOperationResponse {
  id: string;
  status: ExportStatus;
  createdAt: string;
}

export interface CreateGeneratedDocumentRequest {
  type: DocumentType;
  operationId?: string;
  snapshot: DocumentSnapshot;
}

export interface GeneratedDocumentResponse {
  id: string;
  type: DocumentType;
  createdAt: string;
}
