import { exportRequirements } from '../data/requirements';
import { validateExport } from '../lib/validateExport';
import type { Lot, StockView, TraceabilityEvent, Transporter } from '../types/domain';
import type {
  AiExportRequirement,
  CreateExportOperationRequest,
  DocumentSnapshot,
  ExportField,
  ExportOperation,
  ExportRequirement,
  ExportValidationResult,
} from '../types/export';

/** Campos que `validateExport` sabe resolver de forma determinística hoy. */
const VALIDATABLE_FIELDS: ExportField[] = ['lotCode', 'variety', 'quantity', 'origin', 'treatment'];

export interface ExportLogistics {
  buyerName?: string;
  incoterm?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  notes?: string;
  transporterId?: string;
}

export interface ExportReadinessInput {
  lot?: Lot;
  destinationCountry: string;
  quantity: number;
  traceabilityEvents: TraceabilityEvent[];
  stock?: StockView;
  /** Requisitos interpretados por IA. Si no vienen, se usan los estáticos de demo. */
  aiRequirements?: AiExportRequirement[];
}

/**
 * Convierte requisitos interpretados por IA al contrato determinístico.
 * Sólo sobreviven las claves que `validateExport` puede resolver: el resto se
 * descarta porque no habría forma de comprobarlas contra datos reales.
 */
export function toExportRequirements(
  aiRequirements: AiExportRequirement[],
  destinationCountry: string,
  documentType = 'proforma',
): ExportRequirement[] {
  return aiRequirements
    .filter((requirement) => (VALIDATABLE_FIELDS as string[]).includes(requirement.key))
    .map((requirement) => ({
      id: `ai-${destinationCountry}-${requirement.key}`,
      country: destinationCountry,
      documentType,
      field: requirement.key as ExportField,
      label: requirement.label,
      required: requirement.required,
      origin: 'AI_PARSED' as const,
    }));
}

export function analyzeExportReadiness(input: ExportReadinessInput): ExportValidationResult {
  const aiParsed = input.aiRequirements?.length
    ? toExportRequirements(input.aiRequirements, input.destinationCountry)
    : [];

  return validateExport({
    lot: input.lot,
    destinationCountry: input.destinationCountry,
    quantity: input.quantity,
    traceabilityEvents: input.traceabilityEvents,
    requirements: aiParsed.length ? aiParsed : exportRequirements,
    verifiedQuantity: input.stock?.verifiedQuantity,
    stockLocationName: input.stock?.location.name,
  });
}

export function buildExportOperation(
  lot: Lot,
  destinationCountry: string,
  quantity: number,
  logistics: ExportLogistics,
): ExportOperation {
  return {
    id: `EXP-${Date.now()}`,
    lotId: lot.id,
    destinationCountry,
    quantity,
    status: 'generated',
    createdAt: new Date().toISOString(),
    transporterId: logistics.transporterId,
    buyerName: logistics.buyerName,
    incoterm: logistics.incoterm,
    departurePort: logistics.departurePort,
    arrivalPort: logistics.arrivalPort,
    departureDate: logistics.departureDate,
    notes: logistics.notes,
  };
}

/** Payload que consumirá `POST /api/export-operations` cuando exista. */
export function toCreateExportOperationRequest(
  operation: ExportOperation,
): CreateExportOperationRequest {
  return {
    lotId: operation.lotId,
    destinationCountry: operation.destinationCountry,
    quantityKg: operation.quantity,
    customer: operation.buyerName,
    incoterm: operation.incoterm,
    departurePort: operation.departurePort,
    destinationPort: operation.arrivalPort,
    departureDate: operation.departureDate,
    transporterId: operation.transporterId,
    notes: operation.notes,
  };
}

function summarizeEvent(event: TraceabilityEvent): string {
  const product = typeof event.data.product === 'string' ? event.data.product : undefined;
  const netWeight = typeof event.data.netWeight === 'number' ? `${event.data.netWeight} kg` : undefined;
  const result = typeof event.data.result === 'string' ? event.data.result : undefined;
  return product ?? netWeight ?? result ?? 'Sin detalle';
}

export interface DocumentSnapshotInput {
  operation: ExportOperation;
  lot: Lot;
  validation: ExportValidationResult;
  traceabilityEvents: TraceabilityEvent[];
  sourceOfTruth: 'database' | 'mock';
  transporter?: Transporter;
  originLocation?: string;
}

/**
 * Congela los valores usados para emitir un documento. Una vez emitido, el
 * documento no vuelve a leer datos que pudieron cambiar después.
 */
export function buildDocumentSnapshot(input: DocumentSnapshotInput): DocumentSnapshot {
  const { operation, lot, validation, transporter } = input;

  return {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: input.sourceOfTruth,
    exportOperation: operation,
    lot: {
      id: lot.id,
      code: lot.code,
      variety: lot.variety,
      campaign: lot.campaign,
      producer: lot.producer,
      origin: lot.origin,
      harvestDate: lot.harvestDate,
    },
    logistics: {
      buyerName: operation.buyerName,
      incoterm: operation.incoterm,
      departurePort: operation.departurePort,
      arrivalPort: operation.arrivalPort,
      departureDate: operation.departureDate,
      notes: operation.notes,
      transporterId: transporter?.id,
      transporterName: transporter ? (transporter.tradeName || transporter.companyName) : undefined,
      transporterCuit: transporter?.cuit,
      transporterPlate: transporter?.licensePlate,
      originLocation: input.originLocation,
    },
    requirements: validation.requirements.map((requirement) => ({
      field: requirement.field,
      label: requirement.label,
      status: requirement.status,
      value: requirement.value,
      sourceLabel: requirement.source?.label,
      origin: requirement.origin,
    })),
    traceability: input.traceabilityEvents
      .filter((event) => event.lotId === lot.id)
      .map((event) => ({
        id: event.id,
        type: event.type,
        date: event.date,
        summary: summarizeEvent(event),
      })),
  };
}
