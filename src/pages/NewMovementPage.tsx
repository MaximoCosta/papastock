import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  MoveRight,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { formatQuantity } from '../lib/formatters';
import { confirmMovement, interpretMovement, previewMovement } from '../services/movementService';
import { useAppData } from '../state/AppDataContext';
import type { MovementInterpretation, StockTransferPreview } from '../types/domain';

const example = 'Remito 315. Mandé desde Campo Oriente al Frigorífico A: 400 bolsas de Spunta lote 300 y 200 bolsas de Spunta lote 301.';

export function NewMovementPage() {
  const { dataSource, refreshData } = useAppData();
  const [text, setText] = useState(example);
  const [interpretation, setInterpretation] = useState<MovementInterpretation>();
  const [preview, setPreview] = useState<StockTransferPreview>();
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string>();
  const [savedMovement, setSavedMovement] = useState<{ reference: string; remitoNumber?: string }>();

  function resetResult(nextText = text) {
    setText(nextText);
    setInterpretation(undefined);
    setPreview(undefined);
    setShowConfirmation(false);
    setSavedMovement(undefined);
    setError(undefined);
  }

  async function analyzeOrder() {
    setIsInterpreting(true);
    setError(undefined);
    setSavedMovement(undefined);
    setShowConfirmation(false);
    try {
      const parsed = await interpretMovement(text);
      setInterpretation(parsed);
      setPreview(await previewMovement(parsed));
    } catch (cause) {
      setInterpretation(undefined);
      setPreview(undefined);
      setError(cause instanceof Error ? cause.message : 'No se pudo interpretar la orden.');
    } finally {
      setIsInterpreting(false);
    }
  }

  async function persistMovement() {
    if (!interpretation || !preview?.valid) return;
    setIsConfirming(true);
    setError(undefined);
    try {
      const movement = await confirmMovement(interpretation);
      await refreshData();
      setSavedMovement(movement);
      setShowConfirmation(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el movimiento.');
    } finally {
      setIsConfirming(false);
    }
  }

  const lines = (preview?.lines?.length ? preview.lines : (interpretation?.items ?? []).map((item) => ({
    lotCode: item.lotCode,
    quantity: item.quantity,
    unit: item.unit,
    lot: undefined,
    originStock: undefined,
    destinationStock: undefined,
    originAfter: undefined,
    destinationAfter: undefined,
  })));

  return (
    <>
      <PageHeader
        eyebrow="Nivel 1 · Operación asistida"
        title="Mover stock con lenguaje natural"
        description="La IA interpreta la orden. PapaStock valida cada línea y solo escribe en PostgreSQL después de tu confirmación."
      />

      <div className="mb-5 grid grid-cols-[1.15fr_0.85fr] items-start gap-4">
        <section className="border border-[#d8dad3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e2e4de] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Orden de movimiento</h2>
              <p className="mt-1 text-[11px] text-[#747970]">Un remito puede tener varias líneas de lote. La IA no convierte bolsas a kilos.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#6e786f]"><Sparkles size={12} /> Interpretación</span>
          </div>
          <div className="p-5">
            <label>
              <span className="label">Instrucción</span>
              <textarea
                className="field min-h-28 resize-y text-[14px] leading-6"
                value={text}
                onChange={(event) => resetResult(event.target.value)}
                placeholder={example}
              />
            </label>
            <div className="mt-4 flex items-center justify-between gap-4">
              <button className="text-[10px] font-semibold text-[#55705e] hover:underline" onClick={() => resetResult(example)}>Usar ejemplo de remito 315</button>
              <Button onClick={analyzeOrder} disabled={isInterpreting || text.trim().length < 8 || dataSource !== 'database'}>
                <Bot size={15} /> {isInterpreting ? 'Interpretando…' : 'Interpretar y validar'}
              </Button>
            </div>
          </div>
        </section>

        <aside className="border border-[#cad3ca] bg-[#eef3ed] p-5">
          <div className="flex items-center gap-2 text-[#315740]"><ShieldCheck size={18} /><h2 className="text-[13px] font-bold">Control operativo</h2></div>
          <ol className="mt-4 space-y-3 text-[11px] leading-5 text-[#59635b]">
            <li className="flex gap-3"><span className="tabular font-bold text-[#315740]">01</span>La IA extrae remito, ruta y todas las líneas.</li>
            <li className="flex gap-3"><span className="tabular font-bold text-[#315740]">02</span>Si un lote no tiene stock, se bloquea todo el viaje.</li>
            <li className="flex gap-3"><span className="tabular font-bold text-[#315740]">03</span>Una sola transacción PostgreSQL, después de confirmar.</li>
          </ol>
          <div className="mt-5 flex items-center gap-2 border-t border-[#cfd9d0] pt-4 text-[10px] font-semibold text-[#5c695f]">
            <Database size={13} /> {dataSource === 'database' ? 'PostgreSQL conectado' : 'Movimiento deshabilitado en fallback mock'}
          </div>
        </aside>
      </div>

      {error && <div className="mb-5 flex items-start gap-3 border border-[#dfaaa4] bg-[#fdf0ee] p-4 text-[12px] text-[#7c3732]" role="alert"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</div>}

      {interpretation && preview && (
        <section className="border border-[#d8dad3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e2e4de] px-5 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#747970]">Vista previa estructurada</p>
              <h2 className="mt-1 text-[15px] font-semibold">
                {preview.remitoNumber || interpretation.remitoNumber ? `Remito ${preview.remitoNumber ?? interpretation.remitoNumber}` : 'Transferencia interpretada'}
              </h2>
            </div>
            <span className={`border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.07em] ${interpretation.engine === 'llm' ? 'border-[#b7cdbb] bg-[#edf5ee] text-[#315a40]' : 'border-[#dfc98e] bg-[#fff7df] text-[#7b5a19]'}`}>
              {interpretation.engine === 'llm' ? 'Interpretado con IA' : 'Parser local de respaldo'}
            </span>
          </div>

          <div className="grid grid-cols-[1.4fr_0.6fr] divide-x divide-[#e2e4de] border-b border-[#e2e4de]">
            <div className="p-5">
              <p className="label">Ruta</p>
              <div className="flex items-center gap-3 text-[12px] font-semibold">
                <span>{preview.origin?.name ?? interpretation.origin}</span>
                <MoveRight size={17} className="shrink-0 text-[#6c776e]" />
                <span>{preview.destination?.name ?? interpretation.destination}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="label">Líneas</p>
              <p className="tabular text-[19px] font-bold text-[#26362c]">{lines.length}</p>
            </div>
          </div>

          <div className="divide-y divide-[#e8e9e4]">
            {lines.map((line) => (
              <div key={`${line.lotCode}-${line.quantity}-${line.unit}`} className="grid grid-cols-[0.7fr_0.7fr_1.6fr] gap-4 px-5 py-4">
                <div>
                  <p className="text-[16px] font-bold text-[#26362c]">{line.lot?.code ?? line.lotCode}</p>
                  <p className="mt-0.5 text-[10px] text-[#747970]">{line.lot?.variety ?? 'Sin resolver'}</p>
                </div>
                <div>
                  <p className="label">Despacho</p>
                  <p className="tabular text-[14px] font-semibold">{formatQuantity(line.quantity, line.unit)}</p>
                </div>
                <div className="text-[11px] leading-5 text-[#5c665e]">
                  {line.originStock && line.originAfter ? (
                    <p>Origen: {formatQuantity(line.originStock.verifiedQuantity, line.unit)} → {formatQuantity(line.originAfter.verifiedQuantity, line.unit)}</p>
                  ) : <p>Origen sin stock resuelto</p>}
                  {line.destinationAfter ? (
                    <p>Destino: {formatQuantity(line.destinationStock?.verifiedQuantity ?? 0, line.unit)} → {formatQuantity(line.destinationAfter.verifiedQuantity, line.unit)}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5">
            {preview.valid ? (
              <div className="flex items-center justify-between gap-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#3e724f]" />
                  <div>
                    <h3 className="text-[13px] font-bold text-[#315a40]">Validación aprobada</h3>
                    <p className="mt-1 text-[11px] text-[#667068]">Todas las líneas tienen stock. Todavía no se modificó ningún dato.</p>
                  </div>
                </div>
                <Button onClick={() => setShowConfirmation(true)} disabled={Boolean(savedMovement)}><ArrowRight size={14} /> Confirmar movimiento</Button>
              </div>
            ) : (
              <div role="alert">
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#873832]"><AlertTriangle size={16} /> Movimiento bloqueado</h3>
                <ul className="mt-3 space-y-1.5 text-[11px] text-[#704a47]">{preview.errors.map((item) => <li key={`${item.code}-${item.message}`}>• {item.message}</li>)}</ul>
              </div>
            )}

            {showConfirmation && preview.valid && !savedMovement && (
              <div className="mt-5 border border-[#bfd0c2] bg-[#f4f8f4] p-4" role="region" aria-label="Confirmar movimiento de stock">
                <h3 className="text-[12px] font-bold text-[#2f533c]">Confirmación humana requerida</h3>
                <p className="mt-1.5 text-[11px] leading-5 text-[#657067]">
                  Se ejecutará un solo viaje/remito con {lines.length} líneas, en una única transacción. Si una línea falla, no se mueve ninguna.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowConfirmation(false)} disabled={isConfirming}>Cancelar</Button>
                  <Button onClick={persistMovement} disabled={isConfirming}>{isConfirming ? 'Registrando…' : 'Sí, registrar movimiento'}</Button>
                </div>
              </div>
            )}

            {savedMovement && (
              <div className="mt-5 flex items-center justify-between border border-[#afd0b7] bg-[#edf6ef] p-4 text-[#315a40]" role="status">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} />
                  <div>
                    <p className="text-[12px] font-bold">Movimiento registrado</p>
                    <p className="tabular mt-0.5 text-[10px]">
                      {savedMovement.reference}
                      {savedMovement.remitoNumber ? ` · Remito ${savedMovement.remitoNumber}` : ''}
                      {' · PostgreSQL actualizado · recepción pendiente'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => resetResult('')}><RotateCcw size={13} /> Nueva orden</Button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
