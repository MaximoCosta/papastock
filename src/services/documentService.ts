import type { Lot, Shelf, StockView, TraceabilityEvent, Transporter } from '../types/domain';
import { latestTreatment as latestTreatmentEvent, readTreatmentProduct } from '../lib/validateExport';
import type {
  DocumentSnapshot,
  ExportDocumentItem,
  ExportLotLine,
  ExportOperation,
  FacturaDocument,
  GeneratedDocument,
  PlanillaConteoDocument,
  PlanillaStockDocument,
  ProformaDocument,
  RemitoDocument,
} from '../types/export';

const storageKey = 'papastock.documents.v1';

/**
 * Almacenamiento temporal de documentos emitidos. Está encapsulado acá a
 * propósito: cuando exista `generated_documents` en PostgreSQL se reemplaza
 * esta implementación sin tocar componentes React.
 */
export function loadStoredDocuments(): GeneratedDocument[] {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as GeneratedDocument[]) : [];
  } catch {
    return [];
  }
}

export function persistDocuments(documents: GeneratedDocument[]): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(documents));
  } catch {
    // Sin almacenamiento disponible los documentos siguen viviendo en memoria.
  }
}

function nextDocumentId(prefix: string): string {
  return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
}

function latestTreatment(events: TraceabilityEvent[], lot: Pick<Lot, 'id' | 'code'>): string {
  const treatment = latestTreatmentEvent(events, lot);
  return (treatment && readTreatmentProduct(treatment)) || 'No informado';
}

/**
 * Detalle por lote de un documento de exportación. Cada línea queda trazada a su
 * lote: los lotes nunca se agrupan, aunque compartan variedad u origen.
 */
export function buildExportItems(
  lines: ExportLotLine[],
  lots: Lot[],
  events: TraceabilityEvent[],
): ExportDocumentItem[] {
  const lotById = new Map(lots.map((lot) => [String(lot.id), lot]));

  return lines.flatMap((line) => {
    const lot = lotById.get(String(line.lotId)) ?? lots.find((item) => item.code === line.lotId);
    if (!lot) return [];
    return [{
      lotId: lot.id,
      lotCode: lot.code,
      variety: lot.variety,
      campaign: lot.campaign,
      origin: line.origin?.trim() || lot.origin,
      quantity: line.quantity,
      treatment: latestTreatment(events, lot),
    }];
  });
}

/** Resumen legible de un campo cuando el documento cubre varios lotes. */
function joinDistinct(values: Array<string | undefined>): string {
  const unique = [...new Set(values.filter((value): value is string => Boolean(value)))];
  return unique.length > 0 ? unique.join(' · ') : 'No informado';
}

export interface RemitoInput {
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
  snapshot?: DocumentSnapshot;
}

export interface DocumentService {
  createProforma(
    operation: ExportOperation,
    lots: Lot[],
    events: TraceabilityEvent[],
    transporter?: Transporter,
    snapshot?: DocumentSnapshot,
  ): ProformaDocument;
  createFactura(
    operation: ExportOperation,
    lots: Lot[],
    events: TraceabilityEvent[],
    unitPrice: number,
    currency: string,
    transporter?: Transporter,
    snapshot?: DocumentSnapshot,
  ): FacturaDocument;
  createRemito(input: RemitoInput): RemitoDocument;
  createPlanillaStock(records: StockView[], scope: string): PlanillaStockDocument;
  createPlanillaConteo(records: StockView[], shelves: Shelf[], scope: string): PlanillaConteoDocument;
}

export const mockDocumentService: DocumentService = {
  createProforma(operation, lots, events, transporter, snapshot) {
    const items = buildExportItems(operation.items, lots, events);
    return {
      snapshot,
      items,
      id: nextDocumentId('PF'),
      type: 'proforma',
      createdAt: new Date().toISOString(),
      operationId: operation.id,
      exporter: 'Papasud',
      lotCode: joinDistinct(items.map((item) => item.lotCode)),
      variety: joinDistinct(items.map((item) => item.variety)),
      quantity: operation.quantity,
      origin: joinDistinct(items.map((item) => item.origin)),
      destinationCountry: operation.destinationCountry,
      treatment: joinDistinct(items.map((item) => item.treatment)),
      campaign: joinDistinct(items.map((item) => item.campaign)),
      buyerName: operation.buyerName,
      incoterm: operation.incoterm,
      departurePort: operation.departurePort,
      arrivalPort: operation.arrivalPort,
      departureDate: operation.departureDate,
      transporterName: transporter ? (transporter.tradeName || transporter.companyName) : undefined,
      transporterCuit: transporter?.cuit,
      transporterPlate: transporter?.licensePlate,
      transporterVehicle: transporter?.vehicleType,
    };
  },

  createFactura(operation, lots, events, unitPrice, currency, transporter, snapshot) {
    const items = buildExportItems(operation.items, lots, events);
    return {
      snapshot,
      items,
      id: nextDocumentId('FC'),
      type: 'factura',
      createdAt: new Date().toISOString(),
      operationId: operation.id,
      exporter: 'Papasud',
      lotCode: joinDistinct(items.map((item) => item.lotCode)),
      variety: joinDistinct(items.map((item) => item.variety)),
      quantity: operation.quantity,
      destinationCountry: operation.destinationCountry,
      unitPrice,
      currency,
      campaign: joinDistinct(items.map((item) => item.campaign)),
      buyerName: operation.buyerName,
      incoterm: operation.incoterm,
      transporterName: transporter ? (transporter.tradeName || transporter.companyName) : undefined,
    };
  },

  createRemito({
    items,
    originLocation,
    destinationLocation,
    transporter,
    dispatchReference,
    transporterCuit,
    transporterPlate,
    transporterVehicle,
    transporterContact,
    transporterPhone,
    snapshot,
  }) {
    return {
      snapshot,
      items,
      id: nextDocumentId('RM'),
      type: 'remito',
      createdAt: new Date().toISOString(),
      lotCode: joinDistinct(items.map((item) => item.lotCode)),
      variety: joinDistinct(items.map((item) => item.variety)),
      quantity: items.reduce((total, item) => total + item.quantity, 0),
      originLocation,
      destinationLocation,
      transporter,
      dispatchReference,
      transporterCuit,
      transporterPlate,
      transporterVehicle,
      transporterContact,
      transporterPhone,
    };
  },

  createPlanillaStock(records, scope) {
    return {
      id: nextDocumentId('PL'),
      type: 'planilla_stock',
      createdAt: new Date().toISOString(),
      scope,
      rows: records.map((record) => ({
        lotCode: record.lot.code,
        variety: record.lot.variety,
        location: record.location.name,
        declaredQuantity: record.declaredQuantity,
        verifiedQuantity: record.verifiedQuantity,
        difference: record.difference,
        status: record.status,
        verificationPending: Boolean(record.verificationPending),
      })),
    };
  },

  createPlanillaConteo(records, shelves, scope) {
    const shelfById = new Map(shelves.map((shelf) => [shelf.id, shelf]));
    return {
      id: nextDocumentId('PC'),
      type: 'planilla_conteo',
      createdAt: new Date().toISOString(),
      scope,
      rows: records.map((record) => ({
        stockRecordId: record.id,
        lotCode: record.lot.code,
        variety: record.lot.variety,
        location: record.location.name,
        shelfCode: record.shelfId ? shelfById.get(record.shelfId)?.code ?? '—' : '—',
        declaredQuantity: record.declaredQuantity,
        systemVerified: record.verificationPending ? 0 : record.verifiedQuantity,
        verificationPending: Boolean(record.verificationPending),
      })),
    };
  },
};
