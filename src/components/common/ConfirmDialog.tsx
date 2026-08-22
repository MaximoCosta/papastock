import { CalendarDays, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import type { ConfirmedTraceabilityEvent, ParsedTraceabilityEvent } from '../../types/export';
import { Button } from './Button';

function engineLabel(engine: ParsedTraceabilityEvent['engine']): string {
  return engine === 'llm' ? 'IA' : 'Parser local de respaldo';
}

export function ConfirmDialog({
  parsed,
  onCancel,
  onConfirm,
  isSaving = false,
}: {
  parsed: ParsedTraceabilityEvent;
  onCancel: () => void;
  onConfirm: (confirmed: ConfirmedTraceabilityEvent) => void;
  isSaving?: boolean;
}) {
  const [date, setDate] = useState(parsed.date ?? '');
  const [product, setProduct] = useState(parsed.product ?? '');
  const canConfirm = product.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <div className="mt-4 border border-[#bfd0c2] bg-[#f4f8f4] p-4" role="region" aria-label="Revisar información interpretada">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#607265]">Información interpretada</p>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-[#758078]">
            Confianza <span className="tabular font-bold text-[#2e3931]">{Math.round(parsed.confidence * 100)}%</span>
          </span>
          <span className="text-[#758078]">
            Motor <span className="font-bold text-[#2e3931]">{engineLabel(parsed.engine)}</span>
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2.5 border-r border-[#d8e2da] pr-3">
          <FlaskConical size={15} className="mt-0.5 shrink-0 text-[#3d664b]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-[#758078]">Tratamiento fitosanitario</p>
            {parsed.product ? (
              <p className="mt-0.5 text-[12px] font-bold text-[#2e3931]">{parsed.product}</p>
            ) : (
              <>
                <input
                  className="field mt-1 min-h-9 text-[12px]"
                  value={product}
                  onChange={(event) => setProduct(event.target.value)}
                  placeholder="Completar producto"
                  aria-label="Producto del tratamiento"
                />
                <p className="mt-1 text-[10px] text-[#8a6864]">No estaba en el texto. Completalo para continuar.</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CalendarDays size={15} className="mt-0.5 shrink-0 text-[#3d664b]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-[#758078]">Fecha</p>
            <input
              className="field mt-1 min-h-9 text-[12px]"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Fecha del tratamiento"
            />
            {!parsed.date && (
              <p className="mt-1 text-[10px] text-[#8a6864]">No estaba en el texto. Completala para continuar.</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-4 text-[#7a817a]">
        El evento se agregará a la trazabilidad únicamente después de confirmar.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button
          disabled={isSaving || !canConfirm}
          onClick={() => onConfirm({
            type: 'treatment',
            product: product.trim(),
            date,
            sourceText: parsed.sourceText,
            engine: parsed.engine,
            confidence: parsed.confidence,
          })}
        >
          {isSaving ? 'Guardando…' : 'Confirmar y agregar'}
        </Button>
      </div>
    </div>
  );
}
