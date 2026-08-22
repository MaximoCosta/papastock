import { ArrowRight, DatabaseZap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { ExportForm } from '../components/exports/ExportForm';
import { ExportSummary } from '../components/exports/ExportSummary';
import { MissingDataPanel } from '../components/exports/MissingDataPanel';
import { RequirementChecklist } from '../components/exports/RequirementChecklist';
import { aiService, toTraceabilityEvent } from '../services/aiService';
import { mockDocumentService } from '../services/documentService';
import { analyzeExportReadiness } from '../services/exportService';
import { useAppData } from '../state/AppDataContext';
import type { ExportValidationResult, ParsedTraceabilityEvent } from '../types/export';

export function NewExportPage() {
  const navigate = useNavigate();
  const {
    lots,
    locations,
    transporters,
    stockViews,
    traceabilityEvents,
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
  const [validation, setValidation] = useState<ExportValidationResult>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  function resetAnalysis() {
    setValidation(undefined);
  }

  async function analyze() {
    setIsAnalyzing(true);
    const result = analyzeExportReadiness(selectedLot, destinationCountry, quantity, traceabilityEvents);
    await aiService.analyzeRequirements(result);
    setValidation(result);
    setIsAnalyzing(false);
  }

  async function confirmTraceability(parsed: ParsedTraceabilityEvent) {
    if (!selectedLot) return;
    const event = toTraceabilityEvent(parsed, selectedLot.id);
    const saved = await addTraceabilityEvent(event);
    const nextEvents = [...traceabilityEvents.filter((item) => item.id !== saved.id), saved];
    setValidation(analyzeExportReadiness(selectedLot, destinationCountry, quantity, nextEvents));
  }

  function buildOperation() {
    return {
      id: `EXP-${Date.now()}`,
      lotId: selectedLot!.id,
      destinationCountry,
      quantity,
      status: 'generated' as const,
      createdAt: new Date().toISOString(),
      transporterId: transporterId || undefined,
      buyerName,
      incoterm,
      departurePort,
      arrivalPort,
      departureDate,
      notes,
    };
  }

  function generateProforma() {
    if (!selectedLot || !validation?.valid) return;
    const document = mockDocumentService.createProforma(buildOperation(), selectedLot, traceabilityEvents, selectedTransporter);
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  function generateFactura(unitPrice: number, currency: string) {
    if (!selectedLot || !validation?.valid) return;
    const document = mockDocumentService.createFactura(buildOperation(), selectedLot, unitPrice, currency, selectedTransporter);
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  function generateRemito() {
    if (!selectedLot || !validation?.valid || !selectedTransporter) return;
    const origin = stockForLot?.location.name
      ?? locations[0]?.name
      ?? 'Depósito Papasud';
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
        onAnalyze={analyze}
      />

      {validation && selectedLot && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between border-b border-[#d8dad3] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#747970]">Preparación documental</p>
              <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold text-[#292e29]">
                Lote {selectedLot.code}<ArrowRight size={15} className="text-[#8d928a]" />{destinationCountry}
              </h2>
            </div>
            <p className="text-[10px] text-[#777c74]">{validation.completedFields.length} de {validation.requirements.length} requisitos completos</p>
          </div>
          <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-4 max-[1100px]:grid-cols-1">
            <RequirementChecklist requirements={validation.requirements} />
            <div>
              {validation.missingFields.includes('treatment') && <MissingDataPanel onConfirm={confirmTraceability} />}
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
