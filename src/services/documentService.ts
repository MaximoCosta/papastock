import type { Lot, Shelf, StockView, TraceabilityEvent, Transporter } from '../types/domain';
import type {
  DocumentSnapshot,
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

function latestTreatment(events: TraceabilityEvent[], lotId: string): string {
  const treatment = events
    .filter((event) => event.lotId === lotId && event.type === 'treatment')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return typeof treatment?.data.product === 'string' ? treatment.data.product : 'No informado';
}

export interface RemitoInput {
  lot: Lot;
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
  snapshot?: DocumentSnapshot;
}

export interface DocumentService {
  createProforma(
    operation: ExportOperation,
    lot: Lot,
    events: TraceabilityEvent[],
    transporter?: Transporter,
    snapshot?: DocumentSnapshot,
  ): ProformaDocument;
  createFactura(
    operation: ExportOperation,
    lot: Lot,
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
  createProforma(operation, lot, events, transporter, snapshot) {
    return {
      snapshot,
      id: nextDocumentId('PF'),
      type: 'proforma',
      createdAt: new Date().toISOString(),
      operationId: operation.id,
      exporter: 'Papasud',
      lotCode: lot.code,
      variety: lot.variety,
      quantity: operation.quantity,
      origin: lot.origin,
      destinationCountry: operation.destinationCountry,
      treatment: latestTreatment(events, lot.id),
      campaign: lot.campaign,
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

  createFactura(operation, lot, unitPrice, currency, transporter, snapshot) {
    return {
      snapshot,
      id: nextDocumentId('FC'),
      type: 'factura',
      createdAt: new Date().toISOString(),
      operationId: operation.id,
      exporter: 'Papasud',
      lotCode: lot.code,
      variety: lot.variety,
      quantity: operation.quantity,
      destinationCountry: operation.destinationCountry,
      unitPrice,
      currency,
      campaign: lot.campaign,
      buyerName: operation.buyerName,
      incoterm: operation.incoterm,
      transporterName: transporter ? (transporter.tradeName || transporter.companyName) : undefined,
    };
  },

  createRemito({
    lot,
    quantity,
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
      id: nextDocumentId('RM'),
      type: 'remito',
      createdAt: new Date().toISOString(),
      lotCode: lot.code,
      variety: lot.variety,
      quantity,
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
