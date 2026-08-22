import { CalendarDays, FlaskConical } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import type { ParsedTraceabilityEvent } from '../../types/export';
import { Button } from './Button';

export function ConfirmDialog({
  parsed,
  onCancel,
  onConfirm,
  isSaving = false,
}: {
  parsed: ParsedTraceabilityEvent;
  onCancel: () => void;
  onConfirm: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className="anim-scale-in mt-4 border border-[#bfd0c2] bg-[#f4f8f4] p-4" role="region" aria-label="Confirmar información interpretada">
      <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#607265]">Detectamos</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2.5 border-r border-[#d8e2da] pr-3">
          <FlaskConical size={15} className="mt-0.5 text-[#3d664b]" />
          <div>
            <p className="text-[10px] text-[#758078]">Tratamiento</p>
            <p className="mt-0.5 text-[12px] font-bold text-[#2e3931]">{parsed.product}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CalendarDays size={15} className="mt-0.5 text-[#3d664b]" />
          <div>
            <p className="text-[10px] text-[#758078]">Fecha</p>
            <p className="mt-0.5 text-[12px] font-bold text-[#2e3931]">{formatDate(parsed.date)}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-[#7a817a]">El evento se agregará a la trazabilidad únicamente después de confirmar.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button onClick={onConfirm} disabled={isSaving}>{isSaving ? 'Guardando…' : 'Confirmar información'}</Button>
      </div>
    </div>
  );
}
