import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Send, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LotHeader } from '../components/lots/LotHeader';
import { MovementList } from '../components/lots/MovementList';
import { TraceabilityTimeline } from '../components/lots/TraceabilityTimeline';
import { DiscrepancyPanel } from '../components/stock/DiscrepancyPanel';
import { formatDate, formatKg, formatSignedKg } from '../lib/formatters';
import { validateDispatch } from '../lib/validateDispatch';
import { aiService } from '../services/aiService';
import { mockDocumentService } from '../services/documentService';
import { getStockViewByLotId } from '../services/stockService';
import { useAppData } from '../state/AppDataContext';
import type { ValidationResult } from '../types/domain';
import type { DiscrepancyAnalysis } from '../types/export';

export function LotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locations, lots, movements, stockViews, traceabilityEvents, addGeneratedDocument } = useAppData();
  const lot = lots.find((item) => item.code.toLowerCase() === id?.toLowerCase());
  const stock = lot ? getStockViewByLotId(stockViews, lot.id) : undefined;
  const lotMovements = lot ? movements.filter((movement) => movement.lotId === lot.id) : [];
  const lotEvents = lot ? traceabilityEvents.filter((event) => event.lotId === lot.id) : [];
  const [analysis, setAnalysis] = useState<DiscrepancyAnalysis>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>();
  const [dispatchQuantity, setDispatchQuantity] = useState(5000);
  const [dispatchDestination, setDispatchDestination] = useState('');
  const [dispatchTransporter, setDispatchTransporter] = useState('');
  const [dispatchResult, setDispatchResult] = useState<ValidationResult>();

  if (!lot || !stock) return <Navigate to="/lots" replace />;
  const currentLot = lot;
  const currentStock = stock;

  async function analyze() {
    setIsAnalyzing(true);
    setAnalysisError(undefined);
    try {
      const result = await aiService.analyzeDiscrepancy(currentStock, lotMovements, lotEvents);
      setAnalysis(result);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'No se pudo ejecutar el análisis.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function attemptDispatch() {
    setDispatchResult(validateDispatch({
      requestedQuantity: dispatchQuantity,
      declaredQuantity: currentStock.declaredQuantity,
      verifiedQuantity: currentStock.verifiedQuantity,
      hasUnresolvedDiscrepancy: currentStock.status === 'discrepancy',
    }));
  }

  function generateRemito() {
    if (!dispatchResult?.valid) return;
    const document = mockDocumentService.createRemito({
      lot: currentLot,
      quantity: dispatchQuantity,
      originLocation: currentStock.location.name,
      destinationLocation: dispatchDestination || 'No informado',
      transporter: dispatchTransporter,
      dispatchReference: `DESP-${currentLot.code}-${String(Date.now()).slice(-5)}`,
    });
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  const matchingMovement = analysis?.relatedMovementId
    ? lotMovements.find((movement) => movement.id === analysis.relatedMovementId)
    : undefined;

  return (
    <>
      <Link to="/lots" className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#627067] hover:text-[#244a36]"><ArrowLeft size={13} /> Volver a lotes</Link>
      <LotHeader lot={lot} stock={stock} />

      <div className="mb-5 grid grid-cols-[0.9fr_1.1fr] gap-4">
        <section className="border border-[#d8dad3] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#e3e5df] pb-3">
            <h2 className="text-sm font-semibold">Información</h2>
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#81867e]">Ficha de lote</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              ['Variedad', lot.variety],
              ['Campaña', lot.campaign],
              ['Productor', lot.producer],
              ['Cosecha', lot.harvestDate ? formatDate(lot.harvestDate) : 'No informada'],
              ['Origen', lot.origin],
            ].map(([label, value], index) => (
              <div key={label} className={index === 4 ? 'col-span-2 border-l-2 border-[#dbb488] pl-3' : ''}>
                <dt className={`label ${index === 4 ? 'text-[#96552b]!' : ''}`}>{label}</dt>
                <dd className="text-[12px] font-medium text-[#333832]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border border-[#d8dad3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e3e5df] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Stock</h2>
              <p className="mt-1 text-[11px] text-[#747970]">{stock.location.name}</p>
            </div>
            <StatusBadge tone={stock.status === 'discrepancy' ? 'danger' : 'success'}>{stock.status === 'discrepancy' ? 'Control requerido' : 'Conciliado'}</StatusBadge>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#e2e4de] px-2 py-5">
            <div className="px-4"><p className="label">Declarado</p><p className="tabular text-[22px] font-semibold tracking-[-0.03em]">{formatKg(stock.declaredQuantity)}</p></div>
            <div className="px-4"><p className="label">Verificado</p><p className="tabular text-[22px] font-semibold tracking-[-0.03em]">{formatKg(stock.verifiedQuantity)}</p></div>
            <div className="px-4"><p className="label">Diferencia</p><p className={`tabular text-[22px] font-semibold tracking-[-0.03em] ${stock.difference ? 'text-[#a33e37]' : 'text-[#356247]'}`}>{formatSignedKg(stock.difference)}</p></div>
          </div>
          <div className="border-t border-[#e4e6e0] bg-[#fafaf7] px-5 py-2.5 text-[10px] text-[#777c74]">Última verificación · {formatDate(stock.updatedAt)}</div>
        </section>
      </div>

      {stock.status === 'discrepancy' && (
        <div className="mb-5">
          <DiscrepancyPanel analysis={analysis} error={analysisError} isLoading={isAnalyzing} movementDate={matchingMovement?.date} onAnalyze={analyze} />
        </div>
      )}

      <div className="mb-5 grid grid-cols-[1.15fr_0.85fr] gap-4">
        <MovementList movements={lotMovements} locations={locations} />
        <TraceabilityTimeline events={lotEvents} />
      </div>

      <section className="border border-[#d8dad3] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2e4de] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Emitir despacho</h2>
            <p className="mt-1 text-[11px] text-[#747970]">La operación se valida contra stock verificado y discrepancias abiertas.</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#81867e]">Control de seguridad</span>
        </div>
        <div className="grid grid-cols-[200px_1fr_1fr_auto] items-end gap-4 p-5">
          <label>
            <span className="label">Cantidad a despachar</span>
            <span className="relative block">
              <input className="field tabular pr-10" type="number" min="1" value={dispatchQuantity || ''} onChange={(event) => { setDispatchQuantity(Number(event.target.value)); setDispatchResult(undefined); }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#747970]">kg</span>
            </span>
          </label>
          <label>
            <span className="label">Destino</span>
            <input className="field" value={dispatchDestination} onChange={(event) => setDispatchDestination(event.target.value)} placeholder="Ej: Depósito cliente" />
          </label>
          <label>
            <span className="label">Transportista</span>
            <input className="field" value={dispatchTransporter} onChange={(event) => setDispatchTransporter(event.target.value)} placeholder="Ej: Transportes del Sur" />
          </label>
          <Button onClick={attemptDispatch}><Send size={14} /> Emitir despacho</Button>
        </div>
        <p className="px-5 pb-4 text-[10px] leading-4 text-[#777c74]">No se registra ningún despacho si la validación devuelve errores.</p>

        {dispatchResult && !dispatchResult.valid && (
          <div className="m-5 mt-0 border border-[#dfaaa4] bg-[#fdf0ee] p-5" role="alert">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#a23d36] text-white"><Ban size={16} /></span>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#81322d]">Despacho bloqueado</h3>
                <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[#704a47]">
                  {dispatchResult.errors.map((error) => <li key={error.code} className="flex gap-2"><AlertTriangle size={13} className="mt-1 shrink-0" />{error.message}</li>)}
                </ul>
                <div className="tabular mt-4 flex gap-6 border-t border-[#eccbc7] pt-3 text-[11px] font-semibold text-[#5f4643]">
                  <span>Declarado: {formatKg(stock.declaredQuantity)}</span>
                  <span>Verificado: {formatKg(stock.verifiedQuantity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {dispatchResult?.valid && (
          <div className="m-5 mt-0 flex items-center justify-between gap-4 border border-[#b9d1bf] bg-[#eff6f0] p-4">
            <span className="flex items-center gap-3 text-[12px] font-semibold text-[#315a40]"><CheckCircle2 size={17} /> Despacho validado. La operación puede continuar.</span>
            <Button variant="secondary" onClick={generateRemito}><Truck size={14} /> Generar remito</Button>
          </div>
        )}
      </section>
    </>
  );
}
