import { ArrowRight, DatabaseZap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { ExportForm } from '../components/exports/ExportForm';
import { ExportSummary } from '../components/exports/ExportSummary';
import { MissingDataPanel } from '../components/exports/MissingDataPanel';
import { RequirementChecklist } from '../components/exports/RequirementChecklist';
import { aiService, toTraceabilityEvent } from '../services/aiService';
import { mockDocumentService } from '../services/documentService';
import {
  analyzeExportReadiness,
  buildDocumentSnapshot,
  buildExportOperation,
  type ExportLogistics,
} from '../services/exportService';
import { useAppData } from '../state/AppDataContext';
import type { TraceabilityEvent } from '../types/domain';
import type {
  AiExportRequirement,
  AnalysisEngine,
  ConfirmedTraceabilityEvent,
  ExportValidationResult,
} from '../types/export';

const defaultRequirementsText = 'La documentación debe contener número de lote, variedad, origen, '
  + 'peso neto y tratamiento fitosanitario.';

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

  const defaultLot = lots.find((lot) => lot.code === 'A-310') ?? lots[0];
  const [lotId, setLotId] = useState(defaultLot?.id ?? '');
  const [destinationCountry, setDestinationCountry] = useState('Brasil');
  const [quantity, setQuantity] = useState(18000);
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
  const [requirementsEngine, setRequirementsEngine] = useState<AnalysisEngine>();
  const [analysisSummary, setAnalysisSummary] = useState<string>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!lotId && defaultLot) setLotId(defaultLot.id);
  }, [defaultLot, lotId]);

  useEffect(() => {
    if (transporterId) return;
    const preferred = transporters.find((item) => item.id === 'tr-andina') ?? transporters.find((item) => item.active);
    if (preferred) setTransporterId(preferred.id);
  }, [transporterId, transporters]);

  const selectedLot = lots.find((lot) => lot.id === lotId);
  const selectedTransporter = transporters.find((item) => item.id === transporterId);
  const stockForLot = stockViews.find((record) => record.lotId === lotId);

  // Permite elegir un escenario incompleto para la demo sin borrar datos existentes.
  const lotsMissingTreatment = useMemo(() => {
    const withTreatment = new Set(
      traceabilityEvents.filter((event) => event.type === 'treatment').map((event) => event.lotId),
    );
    return lots.filter((lot) => !withTreatment.has(lot.id)).map((lot) => lot.id);
  }, [lots, traceabilityEvents]);

  function resetAnalysis() {
    setValidation(undefined);
    setRequirementsEngine(undefined);
    setAnalysisSummary(undefined);
    setError(undefined);
  }

  function logistics(): ExportLogistics {
    return { buyerName, incoterm, departurePort, arrivalPort, departureDate, notes, transporterId: transporterId || undefined };
  }

  function evaluate(events: TraceabilityEvent[], aiRequirements?: AiExportRequirement[]) {
    return analyzeExportReadiness({
      lot: selectedLot,
      destinationCountry,
      quantity,
      traceabilityEvents: events,
      stock: stockForLot,
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

  async function confirmTraceability(confirmed: ConfirmedTraceabilityEvent) {
    if (!selectedLot) return;
    const saved = await addTraceabilityEvent(toTraceabilityEvent(confirmed, selectedLot.id));
    const nextEvents = [...traceabilityEvents.filter((item) => item.id !== saved.id), saved];
    setValidation(evaluate(nextEvents, validation?.requirements.length
      ? validation.requirements
        .filter((requirement) => requirement.origin === 'AI_PARSED')
        .map((requirement) => ({ key: requirement.field, label: requirement.label, required: true }))
      : undefined));
  }

  function snapshotFor(operation: ReturnType<typeof buildExportOperation>) {
    if (!selectedLot || !validation) return undefined;
    return buildDocumentSnapshot({
      operation,
      lot: selectedLot,
      validation,
      traceabilityEvents,
      sourceOfTruth: dataSource,
      transporter: selectedTransporter,
      originLocation: stockForLot?.location.name,
    });
  }

  function generateProforma() {
    if (!selectedLot || !validation?.valid) return;
    const operation = buildExportOperation(selectedLot, destinationCountry, quantity, logistics());
    const document = mockDocumentService.createProforma(
      operation, selectedLot, traceabilityEvents, selectedTransporter, snapshotFor(operation),
    );
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  function generateFactura(unitPrice: number, currency: string) {
    if (!selectedLot || !validation?.valid) return;
    const operation = buildExportOperation(selectedLot, destinationCountry, quantity, logistics());
    const document = mockDocumentService.createFactura(
      operation, selectedLot, unitPrice, currency, selectedTransporter, snapshotFor(operation),
    );
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  function generateRemito() {
    if (!selectedLot || !validation?.valid || !selectedTransporter) return;
    const operation = buildExportOperation(selectedLot, destinationCountry, quantity, logistics());
    const origin = stockForLot?.location.name ?? locations[0]?.name ?? 'Depósito Papasud';
    const document = mockDocumentService.createRemito({
      lot: selectedLot,
      quantity,
      originLocation: origin,
      destinationLocation: `${arrivalPort || destinationCountry} · ${buyerName || destinationCountry}`,
      transporter: selectedTransporter.tradeName || selectedTransporter.companyName,
      dispatchReference: `EXP-${selectedLot.code}-${departureDate.replaceAll('-', '')}`,
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

  return (
    <>
      <PageHeader
        eyebrow="Nivel 3 · Compliance"
        title="Nueva exportación"
        description="Prepará la operación completa: lote, destino, logística y transportista con perfil precargado."
      />

      <div className="mb-4 flex items-center gap-2 border-l-[3px] border-[#5d7e67] bg-[#e9eee9] px-4 py-2.5 text-[10px] text-[#5d675f]">
        <DatabaseZap size={13} className="text-[#365c43]" />
        Requisitos regulatorios simulados para la demo. La validación de completitud es determinística.
      </div>

      <ExportForm
        lotId={lotId}
        lots={lots}
        lotsMissingTreatment={lotsMissingTreatment}
        destinationCountry={destinationCountry}
        quantity={quantity}
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
        onLotChange={(value) => { setLotId(value); resetAnalysis(); }}
        onCountryChange={(value) => {
          setDestinationCountry(value);
          if (value === 'Brasil') setArrivalPort('Santos');
          if (value === 'Chile') setArrivalPort('Valparaíso');
          if (value === 'Uruguay') setArrivalPort('Montevideo');
          resetAnalysis();
        }}
        onQuantityChange={(value) => { setQuantity(value); resetAnalysis(); }}
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

      {validation && selectedLot && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between border-b border-[#d8dad3] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#747970]">Preparación documental</p>
              <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold text-[#292e29]">
                Lote {selectedLot.code}<ArrowRight size={15} className="text-[#8d928a]" />{destinationCountry}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#777c74]">
                {validation.completedFields.length} de {validation.requirements.length} requisitos completos
              </p>
              {analysisSummary && <p className="mt-0.5 text-[10px] text-[#8b908a]">{analysisSummary}</p>}
            </div>
          </div>
          <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-4 max-[1100px]:grid-cols-1">
            <RequirementChecklist requirements={validation.requirements} engine={requirementsEngine} />
            <div>
              {validation.missingFields.includes('treatment') && (
                <MissingDataPanel
                  lotId={selectedLot.id}
                  lotCode={selectedLot.code}
                  onConfirm={confirmTraceability}
                />
              )}
              {validation.valid && (
                <ExportSummary
                  lot={selectedLot}
                  destination={destinationCountry}
                  quantity={quantity}
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
