import { ArrowRight, DatabaseZap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExportForm } from '../components/exports/ExportForm';
import { ExportSummary } from '../components/exports/ExportSummary';
import { MissingDataPanel } from '../components/exports/MissingDataPanel';
import { RequirementChecklist } from '../components/exports/RequirementChecklist';
import { PageHeader } from '../components/common/PageHeader';
import { lots } from '../data/lots';
import { aiService, toTraceabilityEvent } from '../services/aiService';
import { mockDocumentService } from '../services/documentService';
import { analyzeExportReadiness } from '../services/exportService';
import { useAppData } from '../state/AppDataContext';
import type { ExportValidationResult, ParsedTraceabilityEvent } from '../types/export';

export function NewExportPage() {
  const navigate = useNavigate();
  const { traceabilityEvents, addTraceabilityEvent, addGeneratedDocument } = useAppData();
  const defaultLot = lots.find((lot) => lot.code === 'A-310') ?? lots[0];
  const [lotId, setLotId] = useState(defaultLot.id);
  const [destinationCountry, setDestinationCountry] = useState('Brasil');
  const [quantity, setQuantity] = useState(18000);
  const [validation, setValidation] = useState<ExportValidationResult>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const selectedLot = lots.find((lot) => lot.id === lotId);

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

  function confirmTraceability(parsed: ParsedTraceabilityEvent) {
    if (!selectedLot) return;
    const event = toTraceabilityEvent(parsed, selectedLot.id);
    const nextEvents = [...traceabilityEvents, event];
    addTraceabilityEvent(event);
    setValidation(analyzeExportReadiness(selectedLot, destinationCountry, quantity, nextEvents));
  }

  function generateDocument() {
    if (!selectedLot || !validation?.valid) return;
    const operation = {
      id: `EXP-${Date.now()}`,
      lotId: selectedLot.id,
      destinationCountry,
      quantity,
      status: 'generated' as const,
      createdAt: new Date().toISOString(),
    };
    const document = mockDocumentService.createProforma(operation, selectedLot, traceabilityEvents);
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Nivel 3 · Compliance"
        title="Nueva exportación"
        description="Prepará documentación a partir de los datos operativos y la trazabilidad registrada del lote."
      />

      <div className="mb-4 flex items-center gap-2 border-l-[3px] border-[#5d7e67] bg-[#e9eee9] px-4 py-2.5 text-[10px] text-[#5d675f]">
        <DatabaseZap size={13} className="text-[#365c43]" />
        Requisitos regulatorios simulados para la demo. La validación de completitud es determinística.
      </div>

      <ExportForm
        lotId={lotId}
        destinationCountry={destinationCountry}
        quantity={quantity}
        isLoading={isAnalyzing}
        onLotChange={(value) => { setLotId(value); resetAnalysis(); }}
        onCountryChange={(value) => { setDestinationCountry(value); resetAnalysis(); }}
        onQuantityChange={(value) => { setQuantity(value); resetAnalysis(); }}
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
          <div className="grid grid-cols-[1.05fr_0.95fr] items-start gap-4">
            <RequirementChecklist requirements={validation.requirements} />
            <div>
              {validation.missingFields.includes('treatment') && <MissingDataPanel onConfirm={confirmTraceability} />}
              {validation.valid && <ExportSummary lot={selectedLot} destination={destinationCountry} quantity={quantity} onGenerate={generateDocument} />}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
