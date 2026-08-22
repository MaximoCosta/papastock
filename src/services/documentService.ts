import { DEFAULT_COMMERCIAL, DEFAULT_PACKING, PAPASUD_EXPORTER } from '../data/exporter';
import { addUtcDays, derivePacking, shippingMarks } from '../lib/documentPacking';
import type { Lot, Shelf, StockView, TraceabilityEvent, Transporter } from '../types/domain';
import type {
  DocumentCommercialFields,
  DocumentSnapshot,
  ExportDocumentItem,
  ExportLotLine,
  ExportOperation,
  FacturaDocument,
  GeneratedDocument,
  ListaEmpaqueDocument,
  PlanillaConteoDocument,
  PlanillaStockDocument,
  ProformaDocument,
  RemitoDocument,
} from '../types/export';

const storageKey = 'papastock.documents.v1';

let documentSeq = 0;

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
  documentSeq = (documentSeq + 1) % 100;
  return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}${String(documentSeq).padStart(2, '0')}`;
}

function latestEvent(events: TraceabilityEvent[], lotId: string, type: TraceabilityEvent['type']): TraceabilityEvent | undefined {
  return events
    .filter((event) => event.lotId === lotId && event.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function treatmentLabel(events: TraceabilityEvent[], lotId: string): { product: string; date?: string } {
  const treatment = latestEvent(events, lotId, 'treatment');
  if (!treatment || typeof treatment.data.product !== 'string') {
    return { product: 'No informado' };
  }
  return { product: treatment.data.product, date: treatment.date };
}

function qualityLabel(events: TraceabilityEvent[], lotId: string): string | undefined {
  const quality = latestEvent(events, lotId, 'quality_control');
  if (!quality) return undefined;
  const result = typeof quality.data.result === 'string' ? quality.data.result : undefined;
  const dryMatter = typeof quality.data.dryMatter === 'string' ? quality.data.dryMatter : undefined;
  if (result && dryMatter) return `${result} · MS ${dryMatter}`;
  return result ?? dryMatter;
}

function lotById(lots: Lot[], lotId: string): Lot | undefined {
  return lots.find((lot) => lot.id === lotId);
}

export function buildExportDocumentItems(
  operation: ExportOperation,
  lots: Lot[],
  events: TraceabilityEvent[],
): ExportDocumentItem[] {
  const bagWeightKg = operation.bagWeightKg ?? DEFAULT_PACKING.bagWeightKg;
  const unitPrice = operation.unitPrice;

  return operation.items.flatMap((line) => {
    const lot = lotById(lots, line.lotId);
    if (!lot) return [];
    const packing = derivePacking(line.quantity, bagWeightKg);
    const treatment = treatmentLabel(events, lot.id);
    return [{
      lotId: lot.id,
      lotCode: lot.code,
      variety: lot.variety,
      campaign: lot.campaign,
      origin: lot.origin,
      producer: lot.producer,
      harvestDate: lot.harvestDate,
      quantity: line.quantity,
      treatment: treatment.product,
      treatmentDate: treatment.date,
      qualityResult: qualityLabel(events, lot.id),
      bagCount: packing.bagCount,
      lastBagKg: packing.lastBagKg,
      packingHomogeneous: packing.homogeneous,
      unitPrice,
      lineTotal: unitPrice !== undefined ? line.quantity * unitPrice : undefined,
    }];
  });
}

function summarizeItems(items: ExportDocumentItem[]): {
  lotCode: string;
  variety: string;
  campaign: string;
  origin: string;
  producer: string;
  harvestDate?: string;
  treatment: string;
  qualityResult?: string;
} {
  if (items.length === 0) {
    return { lotCode: '—', variety: '—', campaign: '—', origin: '—', producer: '—', treatment: 'No informado' };
  }
  if (items.length === 1) {
    const [item] = items;
    return {
      lotCode: item.lotCode,
      variety: item.variety,
      campaign: item.campaign,
      origin: item.origin,
      producer: item.producer ?? '—',
      harvestDate: item.harvestDate,
      treatment: item.treatment ?? 'No informado',
      qualityResult: item.qualityResult,
    };
  }

  const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))];
  const varieties = unique(items.map((item) => item.variety));
  const origins = unique(items.map((item) => item.origin));
  const campaigns = unique(items.map((item) => item.campaign));
  const producers = unique(items.map((item) => item.producer));
  const treatments = unique(items.map((item) => item.treatment).filter((value) => value && value !== 'No informado'));

  return {
    lotCode: items.map((item) => item.lotCode).join(' · '),
    variety: varieties.join(' · ') || '—',
    campaign: campaigns.length === 1 ? campaigns[0] : campaigns.join(' · '),
    origin: origins.length === 1 ? origins[0] : 'Orígenes varios',
    producer: producers.length === 1 ? producers[0] : 'Varios productores',
    harvestDate: unique(items.map((item) => item.harvestDate)).length === 1 ? items[0].harvestDate : undefined,
    treatment: treatments.length === items.length ? treatments.join(' · ') : 'Ver detalle por lote',
    qualityResult: unique(items.map((item) => item.qualityResult)).join(' · ') || undefined,
  };
}

function commercialFrom(
  operation: ExportOperation,
  packing: ReturnType<typeof derivePacking>,
  items: ExportDocumentItem[],
): DocumentCommercialFields {
  const summary = summarizeItems(items);
  const createdOn = operation.createdAt.slice(0, 10);
  const validityDays = operation.validityDays ?? DEFAULT_COMMERCIAL.validityDays;
  return {
    producer: summary.producer,
    harvestDate: summary.harvestDate,
    qualityResult: summary.qualityResult,
    bagCount: packing.bagCount,
    bagWeightKg: packing.bagWeightKg,
    packaging: operation.packaging ?? DEFAULT_PACKING.packaging,
    caliber: operation.caliber ?? DEFAULT_PACKING.caliber,
    category: operation.category ?? DEFAULT_PACKING.category,
    hsCode: operation.hsCode ?? DEFAULT_PACKING.hsCode,
    netWeightKg: packing.netWeightKg,
    grossWeightKg: packing.grossWeightKg,
    tareKg: packing.tareKg,
    lastBagKg: packing.lastBagKg,
    packingHomogeneous: packing.homogeneous,
    unitPrice: operation.unitPrice,
    currency: operation.currency ?? DEFAULT_COMMERCIAL.currency,
    paymentTerms: operation.paymentTerms ?? DEFAULT_COMMERCIAL.paymentTerms,
    validityDays,
    validUntil: addUtcDays(operation.departureDate || createdOn, validityDays),
    buyerTaxId: operation.buyerTaxId,
    buyerAddress: operation.buyerAddress,
    buyerCity: operation.buyerCity,
    notes: operation.notes,
    exporterTaxId: PAPASUD_EXPORTER.taxId,
    exporterAddress: PAPASUD_EXPORTER.address,
    exporterCity: `${PAPASUD_EXPORTER.city}, ${PAPASUD_EXPORTER.province}`,
    exporterPhone: PAPASUD_EXPORTER.phone,
    exporterSenasa: PAPASUD_EXPORTER.senasa,
    shippingMarks: shippingMarks(summary.lotCode.includes(' · ') ? operation.id : summary.lotCode, operation.destinationCountry),
    treatmentDate: items.length === 1 ? items[0].treatmentDate : undefined,
  };
}

export interface ExportDocumentContext {
  operation: ExportOperation;
  lots: Lot[];
  events: TraceabilityEvent[];
  transporter?: Transporter;
  snapshot?: DocumentSnapshot;
  originLocation?: string;
}

/** Detalle por lote. Los lotes nunca se agrupan, aunque compartan variedad u origen. */
export function buildExportItems(
  lines: ExportLotLine[],
  lots: Lot[],
  events: TraceabilityEvent[],
): ExportDocumentItem[] {
  return buildExportDocumentItems({
    id: 'tmp',
    items: lines,
    destinationCountry: '',
    quantity: lines.reduce((total, line) => total + line.quantity, 0),
    status: 'draft',
    createdAt: new Date().toISOString(),
  }, lots, events);
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
  operationId?: string;
  destinationCountry?: string;
}

function transporterName(transporter?: Transporter): string | undefined {
  return transporter ? (transporter.tradeName || transporter.companyName) : undefined;
}

export interface DocumentService {
  createProforma(context: ExportDocumentContext): ProformaDocument;
  createFactura(context: ExportDocumentContext): FacturaDocument;
  createListaEmpaque(context: ExportDocumentContext): ListaEmpaqueDocument;
  createExportRemito(context: ExportDocumentContext): RemitoDocument;
  createRemito(input: RemitoInput): RemitoDocument;
  createPlanillaStock(records: StockView[], scope: string): PlanillaStockDocument;
  createPlanillaConteo(records: StockView[], shelves: Shelf[], scope: string): PlanillaConteoDocument;
}

export const mockDocumentService: DocumentService = {
  createProforma(context) {
    const items = buildExportDocumentItems(context.operation, context.lots, context.events);
    const packing = derivePacking(context.operation.quantity, context.operation.bagWeightKg);
    const summary = summarizeItems(items);
    const commercial = commercialFrom(context.operation, packing, items);
    return {
      ...commercial,
      originLocation: context.originLocation,
      snapshot: context.snapshot,
      id: nextDocumentId('PF'),
      type: 'proforma',
      createdAt: new Date().toISOString(),
      operationId: context.operation.id,
      exporter: PAPASUD_EXPORTER.name,
      lotCode: summary.lotCode,
      variety: summary.variety,
      quantity: context.operation.quantity,
      origin: summary.origin,
      destinationCountry: context.operation.destinationCountry,
      treatment: summary.treatment,
      campaign: summary.campaign,
      items,
      buyerName: context.operation.buyerName,
      incoterm: context.operation.incoterm,
      departurePort: context.operation.departurePort,
      arrivalPort: context.operation.arrivalPort,
      departureDate: context.operation.departureDate,
      transporterName: transporterName(context.transporter),
      transporterCuit: context.transporter?.cuit,
      transporterPlate: context.transporter?.licensePlate,
      transporterVehicle: context.transporter?.vehicleType,
    };
  },

  createFactura(context) {
    const unitPrice = context.operation.unitPrice ?? DEFAULT_COMMERCIAL.unitPrice;
    const currency = context.operation.currency ?? DEFAULT_COMMERCIAL.currency;
    const priced: ExportOperation = { ...context.operation, unitPrice, currency };
    const items = buildExportDocumentItems(priced, context.lots, context.events);
    const packing = derivePacking(priced.quantity, priced.bagWeightKg);
    const summary = summarizeItems(items);
    const commercial = commercialFrom(priced, packing, items);
    return {
      ...commercial,
      originLocation: context.originLocation,
      snapshot: context.snapshot,
      id: nextDocumentId('FC'),
      type: 'factura',
      createdAt: new Date().toISOString(),
      operationId: priced.id,
      exporter: PAPASUD_EXPORTER.name,
      lotCode: summary.lotCode,
      variety: summary.variety,
      quantity: priced.quantity,
      destinationCountry: priced.destinationCountry,
      unitPrice,
      currency,
      campaign: summary.campaign,
      items,
      buyerName: priced.buyerName,
      incoterm: priced.incoterm,
      transporterName: transporterName(context.transporter),
      departurePort: priced.departurePort,
      arrivalPort: priced.arrivalPort,
      departureDate: priced.departureDate,
      origin: summary.origin,
      treatment: summary.treatment,
    };
  },

  createListaEmpaque(context) {
    const items = buildExportDocumentItems(context.operation, context.lots, context.events);
    const packing = derivePacking(context.operation.quantity, context.operation.bagWeightKg);
    const summary = summarizeItems(items);
    const commercial = commercialFrom(context.operation, packing, items);
    return {
      ...commercial,
      originLocation: context.originLocation,
      snapshot: context.snapshot,
      id: nextDocumentId('LE'),
      type: 'lista_empaque',
      createdAt: new Date().toISOString(),
      operationId: context.operation.id,
      exporter: PAPASUD_EXPORTER.name,
      lotCode: summary.lotCode,
      variety: summary.variety,
      quantity: context.operation.quantity,
      origin: summary.origin,
      destinationCountry: context.operation.destinationCountry,
      campaign: summary.campaign,
      items,
      buyerName: context.operation.buyerName,
      destinationLocation: context.operation.arrivalPort
        ? `${context.operation.arrivalPort} · ${context.operation.buyerName || context.operation.destinationCountry}`
        : context.operation.destinationCountry,
      transporterName: transporterName(context.transporter),
      transporterPlate: context.transporter?.licensePlate,
      transporterVehicle: context.transporter?.vehicleType,
    };
  },

  createExportRemito(context) {
    const origin = context.originLocation ?? 'Depósito Papasud';
    const destination = context.operation.arrivalPort
      ? `${context.operation.arrivalPort} · ${context.operation.buyerName || context.operation.destinationCountry}`
      : (context.operation.buyerName || context.operation.destinationCountry);
    const dispatchReference = `EXP-${context.operation.id.replace('EXP-', '')}`;
    const items = buildExportDocumentItems(context.operation, context.lots, context.events);
    const packing = derivePacking(context.operation.quantity, context.operation.bagWeightKg);
    const summary = summarizeItems(items);
    const commercial = commercialFrom(context.operation, packing, items);
    return {
      ...commercial,
      originLocation: origin,
      snapshot: context.snapshot,
      id: nextDocumentId('RM'),
      type: 'remito',
      createdAt: new Date().toISOString(),
      operationId: context.operation.id,
      lotCode: summary.lotCode,
      variety: summary.variety,
      quantity: context.operation.quantity,
      items,
      destinationLocation: destination,
      transporter: transporterName(context.transporter) ?? 'No informado',
      dispatchReference,
      transporterCuit: context.transporter?.cuit,
      transporterPlate: context.transporter?.licensePlate,
      transporterVehicle: context.transporter?.vehicleType,
      transporterContact: context.transporter?.contactName,
      transporterPhone: context.transporter?.phone,
      campaign: summary.campaign,
      origin: summary.origin,
      destinationCountry: context.operation.destinationCountry,
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
    operationId,
    destinationCountry,
  }) {
    const quantity = items.reduce((total, item) => total + item.quantity, 0);
    const packing = derivePacking(quantity);
    const lotCode = items.map((item) => item.lotCode).join(' · ') || '—';
    const variety = [...new Set(items.map((item) => item.variety))].join(' · ') || '—';
    const origin = [...new Set(items.map((item) => item.origin))].join(' · ') || undefined;
    return {
      id: nextDocumentId('RM'),
      type: 'remito',
      createdAt: new Date().toISOString(),
      operationId,
      lotCode,
      variety,
      quantity,
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
      campaign: items[0]?.campaign,
      origin,
      destinationCountry,
      producer: items.length === 1 ? items[0].producer : undefined,
      harvestDate: items.length === 1 ? items[0].harvestDate : undefined,
      bagCount: packing.bagCount,
      bagWeightKg: packing.bagWeightKg,
      packaging: DEFAULT_PACKING.packaging,
      caliber: DEFAULT_PACKING.caliber,
      category: DEFAULT_PACKING.category,
      netWeightKg: packing.netWeightKg,
      grossWeightKg: packing.grossWeightKg,
      tareKg: packing.tareKg,
      lastBagKg: packing.lastBagKg,
      packingHomogeneous: packing.homogeneous,
      shippingMarks: shippingMarks(items.length === 1 ? lotCode : operationId || lotCode, destinationCountry || destinationLocation),
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
