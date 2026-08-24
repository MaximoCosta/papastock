import { ArrowRight, DatabaseZap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { ExportForm, type ExportCommercialValues } from '../components/exports/ExportForm';
import { ExportSummary } from '../components/exports/ExportSummary';
import { MissingDataPanel } from '../components/exports/MissingDataPanel';
import { RequirementChecklist } from '../components/exports/RequirementChecklist';
import { DEFAULT_COMMERCIAL, DEFAULT_PACKING, DESTINATION_DEFAULTS } from '../data/exporter';
import { derivePacking } from '../lib/documentPacking';
import { aiService, toTraceabilityEvent } from '../services/aiService';
import { buildExportItems, mockDocumentService, type ExportDocumentContext } from '../services/documentService';
import {
  analyzeExportReadiness,
  buildDocumentSnapshot,
  buildExportOperation,
  type ExportLogistics,
} from '../services/exportService';
import { useAppData } from '../state/AppDataContext';
import type { Lot, TraceabilityEvent } from '../types/domain';
import type {
  AiExportRequirement,
  AnalysisEngine,
  ConfirmedTraceabilityEvent,
  ExportLotLine,
  ExportValidationResult,
  GeneratedDocument,
} from '../types/export';

const defaultRequirementsText = 'La documentación debe contener número de lote, variedad, origen, '
  + 'peso neto y tratamiento fitosanitario.';

const brasilDefaults = DESTINATION_DEFAULTS.Brasil;

export function NewExportPage() {
  const navigate = useNavigate();
  const {
    lots,
    locations,
    transporters,
    stockViews,
    traceabilityEvents,
    dataSource,
    addTraceabilityEvent,
    addGeneratedDocument,
    addGeneratedDocuments,
  } = useAppData();

  const defaultLot = lots.find((lot) => lot.code === 'A-310') ?? lots[0];
  const [exportLines, setExportLines] = useState<ExportLotLine[]>(() => (
    defaultLot ? [{ lotId: defaultLot.id, quantity: 18000 }] : []
  ));
  const [destinationCountry, setDestinationCountry] = useState('Brasil');
  const [buyerName, setBuyerName] = useState(brasilDefaults.buyerName);
  const [incoterm, setIncoterm] = useState(DEFAULT_COMMERCIAL.incoterm);
  const [departurePort, setDeparturePort] = useState('Bahía Blanca');
  const [arrivalPort, setArrivalPort] = useState(brasilDefaults.arrivalPort);
  const [departureDate, setDepartureDate] = useState('2026-08-28');
  const [transporterId, setTransporterId] = useState('');
  const [notes, setNotes] = useState('Mantener cadena de frío 3–5 °C. Documentación fitosanitaria adjunta.');
  const [commercial, setCommercial] = useState<ExportCommercialValues>({
    buyerTaxId: brasilDefaults.buyerTaxId,
    buyerAddress: brasilDefaults.buyerAddress,
    buyerCity: brasilDefaults.buyerCity,
    bagWeightKg: DEFAULT_PACKING.bagWeightKg,
    packaging: DEFAULT_PACKING.packaging,
    caliber: DEFAULT_PACKING.caliber,
    category: DEFAULT_PACKING.category,
    hsCode: DEFAULT_PACKING.hsCode,
    unitPrice: DEFAULT_COMMERCIAL.unitPrice,
    paymentTerms: DEFAULT_COMMERCIAL.paymentTerms,
    validityDays: DEFAULT_COMMERCIAL.validityDays,
  });
  const [useAiRequirements, setUseAiRequirements] = useState(false);
  const [requirementsSourceText, setRequirementsSourceText] = useState(defaultRequirementsText);
  const [validation, setValidation] = useState<ExportValidationResult>();
  const [requirementsEngine, setRequirementsEngine] = useState<AnalysisEngine>();
  const [analysisSummary, setAnalysisSummary] = useState<string>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (exportLines.length > 0 || lots.length === 0) return;
    const firstLot = lots.find((lot) => lot.code === 'A-310') ?? lots[0];
    setExportLines([{
      lotId: firstLot.id,
      quantity: 18000,
      origin: firstLot.origin?.trim() || undefined,
    }]);
  }, [exportLines.length, lots]);

  useEffect(() => {
    if (transporterId) return;
    const preferred = transporters.find((item) => item.id === 'tr-andina') ?? transporters.find((item) => item.active);
    if (preferred) setTransporterId(preferred.id);
  }, [transporterId, transporters]);

  const selectedLots = useMemo(
    () => exportLines
      .map((line) => lots.find((lot) => lot.id === line.lotId))
      .filter((lot): lot is Lot => Boolean(lot)),
    [exportLines, lots],
  );
  const selectedTransporter = transporters.find((item) => item.id === transporterId);
  const totalQuantity = exportLines.reduce((total, line) => total + line.quantity, 0);
  const packing = derivePacking(totalQuantity, commercial.bagWeightKg);

  const lotsMissingTreatment = useMemo(() => {
    const withTreatment = new Set(
      traceabilityEvents.filter((event) => event.type === 'treatment').map((event) => event.lotId),
    );
    return lots.filter((lot) => !withTreatment.has(lot.id)).map((lot) => lot.id);
  }, [lots, traceabilityEvents]);

  const missingTreatmentLots = useMemo(() => {
    if (!validation) return [];
    const missingIds = new Set(
      validation.requirements
        .filter((requirement) => requirement.field === 'treatment' && requirement.status === 'missing' && requirement.lotId)
        .map((requirement) => requirement.lotId as string),
    );
    return selectedLots.filter((lot) => missingIds.has(lot.id));
  }, [selectedLots, validation]);

  function resetAnalysis() {
    setValidation(undefined);
    setRequirementsEngine(undefined);
    setAnalysisSummary(undefined);
    setError(undefined);
  }

  function applyDestination(country: string) {
    const defaults = DESTINATION_DEFAULTS[country];
    setDestinationCountry(country);
    if (defaults) {
      setArrivalPort(defaults.arrivalPort);
      const knownBuyers = Object.values(DESTINATION_DEFAULTS).map((item) => item.buyerName);
      if (knownBuyers.includes(buyerName)) {
        setBuyerName(defaults.buyerName);
        setCommercial((current) => ({
          ...current,
          buyerTaxId: defaults.buyerTaxId,
          buyerAddress: defaults.buyerAddress,
          buyerCity: defaults.buyerCity,
        }));
      }
    }
    resetAnalysis();
  }

  function logistics(): ExportLogistics {
    return {
      buyerName,
      buyerTaxId: commercial.buyerTaxId,
      buyerAddress: commercial.buyerAddress,
      buyerCity: commercial.buyerCity,
      incoterm,
      departurePort,
      arrivalPort,
      departureDate,
      notes,
      transporterId: transporterId || undefined,
      paymentTerms: commercial.paymentTerms,
      validityDays: commercial.validityDays,
      unitPrice: commercial.unitPrice,
      currency: DEFAULT_COMMERCIAL.currency,
      bagWeightKg: commercial.bagWeightKg,
      packaging: commercial.packaging,
      caliber: commercial.caliber,
      category: commercial.category,
      hsCode: commercial.hsCode,
    };
  }

  function evaluate(events: TraceabilityEvent[], aiRequirements?: AiExportRequirement[]) {
    return analyzeExportReadiness({
      lines: exportLines.map((line) => ({
        ...line,
        lot: lots.find((lot) => lot.id === line.lotId),
        stock: stockViews.find((record) => record.lotId === line.lotId),
      })),
      destinationCountry,
      traceabilityEvents: events,
      aiRequirements,
    });
  }

  async function analyze() {
    setIsAnalyzing(true);
    setError(undefined);
    try {
      let aiRequirements: AiExportRequirement[] | undefined;
      if (useAiRequirements && requirementsSourceText.trim().length >= 8) {
        const parsed = await aiService.analyzeExportRequirements(
          destinationCountry,
          'proforma',
          requirementsSourceText,
        );
        aiRequirements = parsed.requirements;
        setRequirementsEngine(parsed.engine);
      } else {
        setRequirementsEngine(undefined);
      }

      const result = evaluate(traceabilityEvents, aiRequirements);
      setAnalysisSummary((await aiService.analyzeRequirements(result)).summary);
      setValidation(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo analizar la documentación.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function confirmTraceability(lot: Lot, confirmed: ConfirmedTraceabilityEvent) {
    const saved = await addTraceabilityEvent(toTraceabilityEvent(confirmed, lot.id));
    const nextEvents = [...traceabilityEvents.filter((item) => item.id !== saved.id), saved];
    setValidation(evaluate(nextEvents, validation?.requirements.some((requirement) => requirement.origin === 'AI_PARSED')
      ? [...new Map(
        validation.requirements
          .filter((requirement) => requirement.origin === 'AI_PARSED')
          .map((requirement) => [requirement.field, { key: requirement.field, label: requirement.label, required: true }]),
      ).values()]
      : undefined));
  }

  function buildContext(): ExportDocumentContext | undefined {
    if (dataSource === 'unavailable' || selectedLots.length === 0 || !validation) return undefined;
    const operation = buildExportOperation(exportLines, destinationCountry, logistics());
    const originLocation = exportLines
      .map((line) => stockViews.find((record) => record.lotId === line.lotId)?.location.name)
      .filter((name): name is string => Boolean(name))
      .filter((name, index, names) => names.indexOf(name) === index)
      .join(' · ') || locations[0]?.name;
    return {
      operation,
      lots: selectedLots,
      events: traceabilityEvents,
      transporter: selectedTransporter,
      originLocation,
      snapshot: buildDocumentSnapshot({
        operation,
        lots: selectedLots,
        validation,
        traceabilityEvents,
        sourceOfTruth: dataSource,
        transporter: selectedTransporter,
        originLocation,
      }),
    };
  }

  function emit(build: (context: ExportDocumentContext) => GeneratedDocument | GeneratedDocument[]) {
    if (!validation?.valid) return;
    const context = buildContext();
    if (!context) return;
    const created = build(context);
    const documents = Array.isArray(created) ? created : [created];
    if (documents.length === 1) addGeneratedDocument(documents[0]);
    else addGeneratedDocuments(documents);
    navigate(`/documents/${documents[0].id}`);
  }

  const headingLots = selectedLots.map((lot) => lot.code).join(' · ') || 'Lotes';

  return (
    <>
      <PageHeader
        eyebrow="Nivel 3 · Compliance"
        title="Nueva exportación"
        description="Prepará la operación completa: lotes, destino, empaque, condiciones comerciales y transportista."
      />

      <div className="mb-4 flex items-center gap-2 border-l-[3px] border-[#5d7e67] bg-[#e9eee9] px-4 py-2.5 text-[10px] text-[#5d675f]">
        <DatabaseZap size={13} className="text-[#365c43]" />
        Requisitos regulatorios simulados para la demo. La validación de completitud es determinística.
      </div>

      <ExportForm
        exportLines={exportLines.length ? exportLines : (defaultLot ? [{ lotId: defaultLot.id, quantity: 18000 }] : [])}
        lots={lots}
        lotsMissingTreatment={lotsMissingTreatment}
        stockViews={stockViews}
        destinationCountry={destinationCountry}
        buyerName={buyerName}
        incoterm={incoterm}
        departurePort={departurePort}
        arrivalPort={arrivalPort}
        departureDate={departureDate}
        transporterId={transporterId}
        transporters={transporters}
        notes={notes}
        commercial={commercial}
        requirementsSourceText={requirementsSourceText}
        useAiRequirements={useAiRequirements}
        isLoading={isAnalyzing}
        onExportLinesChange={(lines) => { setExportLines(lines); resetAnalysis(); }}
        onCountryChange={applyDestination}
        onBuyerChange={setBuyerName}
        onIncotermChange={setIncoterm}
        onDeparturePortChange={setDeparturePort}
        onArrivalPortChange={setArrivalPort}
        onDepartureDateChange={setDepartureDate}
        onTransporterChange={(value) => { setTransporterId(value); resetAnalysis(); }}
        onNotesChange={setNotes}
        onCommercialChange={(patch) => setCommercial((current) => ({ ...current, ...patch }))}
        onRequirementsSourceTextChange={(value) => { setRequirementsSourceText(value); resetAnalysis(); }}
        onUseAiRequirementsChange={(value) => { setUseAiRequirements(value); resetAnalysis(); }}
        onAnalyze={analyze}
      />

      {error && (
        <div className="mt-4 border border-[#dfaaa4] bg-[#fdf0ee] p-4 text-[12px] text-[#7c3732]" role="alert">{error}</div>
      )}

      {validation && selectedLots.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between border-b border-[#d8dad3] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#747970]">Preparación documental</p>
              <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold text-[#292e29]">
                {headingLots}<ArrowRight size={15} className="text-[#8d928a]" />{destinationCountry}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#777c74]">
                {validation.requirements.filter((requirement) => requirement.status === 'complete').length} de {validation.requirements.length} requisitos completos
              </p>
              {analysisSummary && <p className="mt-0.5 text-[10px] text-[#8b908a]">{analysisSummary}</p>}
            </div>
          </div>
          <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-4 max-[1100px]:grid-cols-1">
            <RequirementChecklist requirements={validation.requirements} lots={selectedLots} engine={requirementsEngine} />
            <div className="space-y-4">
              {missingTreatmentLots.map((lot) => (
                <MissingDataPanel
                  key={lot.id}
                  lotId={lot.id}
                  lotCode={lot.code}
                  onConfirm={(confirmed) => confirmTraceability(lot, confirmed)}
                />
              ))}
              {validation.valid && (
                <ExportSummary
                  lots={selectedLots}
                  items={buildExportItems(exportLines, selectedLots, traceabilityEvents)}
                  destination={destinationCountry}
                  quantity={totalQuantity}
                  buyerName={buyerName}
                  incoterm={incoterm}
                  departurePort={departurePort}
                  arrivalPort={arrivalPort}
                  departureDate={departureDate}
                  packing={packing}
                  unitPrice={commercial.unitPrice}
                  currency={DEFAULT_COMMERCIAL.currency}
                  transporter={selectedTransporter}
                  onGeneratePack={() => emit((context) => [
                    mockDocumentService.createProforma(context),
                    mockDocumentService.createFactura(context),
                    mockDocumentService.createListaEmpaque(context),
                    mockDocumentService.createExportRemito(context),
                  ])}
                  onGenerateProforma={() => emit((context) => mockDocumentService.createProforma(context))}
                  onGenerateFactura={() => emit((context) => mockDocumentService.createFactura(context))}
                  onGenerateRemito={() => emit((context) => mockDocumentService.createExportRemito(context))}
                  onGenerateListaEmpaque={() => emit((context) => mockDocumentService.createListaEmpaque(context))}
                />
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
