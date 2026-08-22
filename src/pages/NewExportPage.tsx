import { ArrowRight, DatabaseZap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { ExportForm } from '../components/exports/ExportForm';
import { ExportSummary } from '../components/exports/ExportSummary';
import { MissingDataPanel } from '../components/exports/MissingDataPanel';
import { RequirementChecklist } from '../components/exports/RequirementChecklist';
import { aiService, toTraceabilityEvent } from '../services/aiService';
import { buildExportItems, mockDocumentService } from '../services/documentService';
import {
  analyzeExportReadiness,
  buildDocumentSnapshot,
  buildExportOperation,
  type ExportLogistics,
} from '../services/exportService';
import { getStockViewByLotId } from '../services/stockService';
import { useAppData } from '../state/AppDataContext';
import type { Lot, TraceabilityEvent } from '../types/domain';
import type {
  AiExportRequirement,
  AnalysisEngine,
  ConfirmedTraceabilityEvent,
  ExportLotLine,
  ExportOperation,
  ExportValidationResult,
} from '../types/export';

const defaultRequirementsText = 'La documentación debe contener número de lote, variedad, origen, '
  + 'peso neto y tratamiento fitosanitario.';

/** Cantidad por defecto de la primera línea, alineada con el escenario de demo A-310. */
const defaultLineQuantity = 18000;

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
  } = useAppData();

  const [exportLines, setExportLines] = useState<ExportLotLine[]>([]);
  const [destinationCountry, setDestinationCountry] = useState('Brasil');
  const [buyerName, setBuyerName] = useState('Distribuidora Sul Ltda.');
  const [incoterm, setIncoterm] = useState('FOB');
  const [departurePort, setDeparturePort] = useState('Bahía Blanca');
  const [arrivalPort, setArrivalPort] = useState('Santos');
  const [departureDate, setDepartureDate] = useState('2026-08-28');
  const [transporterId, setTransporterId] = useState('');
  const [notes, setNotes] = useState('Mantener cadena de frío 3–5 °C. Documentación fitosanitaria adjunta.');
  const [useAiRequirements, setUseAiRequirements] = useState(false);
  const [requirementsSourceText, setRequirementsSourceText] = useState(defaultRequirementsText);
  const [validation, setValidation] = useState<ExportValidationResult>();
  const [aiRequirements, setAiRequirements] = useState<AiExportRequirement[]>();
  const [requirementsEngine, setRequirementsEngine] = useState<AnalysisEngine>();
  const [analysisSummary, setAnalysisSummary] = useState<string>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (exportLines.length > 0 || lots.length === 0) return;
    const firstLot = lots.find((lot) => lot.code === 'A-310') ?? lots[0];
    setExportLines([{ lotId: firstLot.id, quantity: defaultLineQuantity }]);
  }, [exportLines.length, lots]);

  useEffect(() => {
    if (transporterId) return;
    const preferred = transporters.find((item) => item.id === 'tr-andina') ?? transporters.find((item) => item.active);
    if (preferred) setTransporterId(preferred.id);
  }, [transporterId, transporters]);

  const selectedTransporter = transporters.find((item) => item.id === transporterId);

  /** Una línea por lote, con su lote y su stock resueltos. Los lotes no se agrupan. */
  const readinessLines = useMemo(() => exportLines.map((line) => ({
    ...line,
    lot: lots.find((lot) => lot.id === line.lotId),
    stock: getStockViewByLotId(stockViews, line.lotId),
  })), [exportLines, lots, stockViews]);

  const selectedLots = useMemo(
    () => readinessLines.map((line) => line.lot).filter((lot): lot is Lot => Boolean(lot)),
    [readinessLines],
  );
  const totalQuantity = exportLines.reduce((total, line) => total + line.quantity, 0);

  // Permite elegir un escenario incompleto para la demo sin borrar datos existentes.
  const lotsMissingTreatment = useMemo(() => {
    const withTreatment = new Set(
      traceabilityEvents.filter((event) => event.type === 'treatment').map((event) => event.lotId),
    );
    return lots.filter((lot) => !withTreatment.has(lot.id)).map((lot) => lot.id);
  }, [lots, traceabilityEvents]);

  /** Lotes de la operación cuyo tratamiento la validación marcó como faltante. */
  const lotsNeedingTreatment = useMemo(() => {
    if (!validation) return [];
    const pending = new Set(
      validation.requirements
        .filter((requirement) => requirement.field === 'treatment' && requirement.status === 'missing')
        .map((requirement) => requirement.lotId),
    );
    return selectedLots.filter((lot) => pending.has(lot.id));
  }, [selectedLots, validation]);

  function resetAnalysis() {
    setValidation(undefined);
    setAiRequirements(undefined);
    setRequirementsEngine(undefined);
    setAnalysisSummary(undefined);
    setError(undefined);
  }

  function logistics(): ExportLogistics {
    return { buyerName, incoterm, departurePort, arrivalPort, departureDate, notes, transporterId: transporterId || undefined };
  }

  function evaluate(events: TraceabilityEvent[], requirements?: AiExportRequirement[]) {
    return analyzeExportReadiness({
      lines: readinessLines,
      destinationCountry,
      traceabilityEvents: events,
      aiRequirements: requirements,
    });
  }

  async function analyze() {
    setIsAnalyzing(true);
    setError(undefined);
    try {
      let parsedRequirements: AiExportRequirement[] | undefined;
      if (useAiRequirements && requirementsSourceText.trim().length >= 8) {
        const parsed = await aiService.analyzeExportRequirements(
          destinationCountry,
          'proforma',
          requirementsSourceText,
        );
        parsedRequirements = parsed.requirements;
        setRequirementsEngine(parsed.engine);
      } else {
        setRequirementsEngine(undefined);
      }

      setAiRequirements(parsedRequirements);
      const result = evaluate(traceabilityEvents, parsedRequirements);
      setAnalysisSummary((await aiService.analyzeRequirements(result)).summary);
      setValidation(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo analizar la documentación.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function confirmTraceability(lotId: string, confirmed: ConfirmedTraceabilityEvent) {
    const saved = await addTraceabilityEvent(toTraceabilityEvent(confirmed, lotId));
    const nextEvents = [...traceabilityEvents.filter((item) => item.id !== saved.id), saved];
    setValidation(evaluate(nextEvents, aiRequirements));
  }

  function snapshotFor(operation: ExportOperation) {
    if (!validation) return undefined;
    return buildDocumentSnapshot({
      operation,
      lots: selectedLots,
      validation,
      traceabilityEvents,
      sourceOfTruth: dataSource,
      transporter: selectedTransporter,
      originLocation: readinessLines[0]?.stock?.location.name,
    });
  }

  /** Congela la operación una sola vez por documento emitido. */
  function operationForDocument(): ExportOperation | undefined {
    if (selectedLots.length === 0 || !validation?.valid) return undefined;
    return buildExportOperation(exportLines, destinationCountry, logistics());
  }

  function generateProforma() {
    const operation = operationForDocument();
    if (!operation) return;
    const document = mockDocumentService.createProforma(
      operation, selectedLots, traceabilityEvents, selectedTransporter, snapshotFor(operation),
    );
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  function generateFactura(unitPrice: number, currency: string) {
    const operation = operationForDocument();
    if (!operation) return;
    const document = mockDocumentService.createFactura(
      operation, selectedLots, traceabilityEvents, unitPrice, currency, selectedTransporter, snapshotFor(operation),
    );
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  function generateRemito() {
    const operation = operationForDocument();
    if (!operation || !selectedTransporter) return;
    const origin = readinessLines[0]?.stock?.location.name ?? locations[0]?.name ?? 'Depósito Papasud';
    const reference = selectedLots.length === 1
      ? `EXP-${selectedLots[0].code}-${departureDate.replaceAll('-', '')}`
      : `EXP-${selectedLots.length}L-${departureDate.replaceAll('-', '')}`;
    const document = mockDocumentService.createRemito({
      items: buildExportItems(exportLines, selectedLots, traceabilityEvents),
      originLocation: origin,
      destinationLocation: `${arrivalPort || destinationCountry} · ${buyerName || destinationCountry}`,
      transporter: selectedTransporter.tradeName || selectedTransporter.companyName,
      dispatchReference: reference,
      transporterCuit: selectedTransporter.cuit,
      transporterPlate: selectedTransporter.licensePlate,
      transporterVehicle: selectedTransporter.vehicleType,
      transporterContact: selectedTransporter.contactName,
      transporterPhone: selectedTransporter.phone,
      snapshot: snapshotFor(operation),
    });
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  const operationTitle = selectedLots.length === 1
    ? `Lote ${selectedLots[0].code}`
    : `${selectedLots.length} lotes`;

  return (
    <>
      <PageHeader
        eyebrow="Nivel 3 · Compliance"
        title="Nueva exportación"
        description="Prepará la operación completa: lotes, pesos, destino, logística y transportista con perfil precargado."
      />

      <div className="mb-4 flex items-center gap-2 border-l-[3px] border-[#5d7e67] bg-[#e9eee9] px-4 py-2.5 text-[10px] text-[#5d675f]">
        <DatabaseZap size={13} className="text-[#365c43]" />
        Requisitos regulatorios simulados para la demo. La validación de completitud es determinística.
      </div>

      <ExportForm
        exportLines={exportLines}
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
        requirementsSourceText={requirementsSourceText}
        useAiRequirements={useAiRequirements}
        isLoading={isAnalyzing}
        onExportLinesChange={(lines) => { setExportLines(lines); resetAnalysis(); }}
        onCountryChange={(value) => {
          setDestinationCountry(value);
          if (value === 'Brasil') setArrivalPort('Santos');
          if (value === 'Chile') setArrivalPort('Valparaíso');
          if (value === 'Uruguay') setArrivalPort('Montevideo');
          resetAnalysis();
        }}
        onBuyerChange={setBuyerName}
        onIncotermChange={setIncoterm}
        onDeparturePortChange={setDeparturePort}
        onArrivalPortChange={setArrivalPort}
        onDepartureDateChange={setDepartureDate}
        onTransporterChange={(value) => { setTransporterId(value); resetAnalysis(); }}
        onNotesChange={setNotes}
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
                {operationTitle}<ArrowRight size={15} className="text-[#8d928a]" />{destinationCountry}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#777c74]">
                {validation.requirements.filter((requirement) => requirement.status === 'complete').length}
                {' de '}
                {validation.requirements.length} requisitos completos
              </p>
              {analysisSummary && <p className="mt-0.5 text-[10px] text-[#8b908a]">{analysisSummary}</p>}
            </div>
          </div>
          <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-4 max-[1100px]:grid-cols-1">
            <RequirementChecklist
              requirements={validation.requirements}
              lots={selectedLots}
              engine={requirementsEngine}
            />
            <div className="space-y-3">
              {lotsNeedingTreatment.map((lot) => (
                <MissingDataPanel
                  key={lot.id}
                  lotId={lot.id}
                  lotCode={lot.code}
                  onConfirm={(confirmed) => confirmTraceability(lot.id, confirmed)}
                />
              ))}
              {validation.valid && (
                <ExportSummary
                  items={buildExportItems(exportLines, selectedLots, traceabilityEvents)}
                  totalQuantity={totalQuantity}
                  destination={destinationCountry}
                  buyerName={buyerName}
                  incoterm={incoterm}
                  departurePort={departurePort}
                  arrivalPort={arrivalPort}
                  departureDate={departureDate}
                  transporter={selectedTransporter}
                  onGenerateProforma={generateProforma}
                  onGenerateFactura={generateFactura}
                  onGenerateRemito={generateRemito}
                />
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
