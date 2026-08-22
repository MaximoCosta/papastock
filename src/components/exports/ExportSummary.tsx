import { ArrowRight, CheckCircle2, FileOutput } from 'lucide-react';
import type { Lot } from '../../types/domain';
import { formatKg } from '../../lib/formatters';
import { Button } from '../common/Button';

export function ExportSummary({ lot, destination, quantity, onGenerate }: { lot: Lot; destination: string; quantity: number; onGenerate: () => void }) {
  return (
    <section className="border border-[#b8cfbd] bg-[#f2f7f3]">
      <div className="flex items-start justify-between gap-6 p-5">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#b9d0bf] bg-white text-[#315d42]">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#53715c]">Documentación lista</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[#25412f]">Todos los requisitos fueron encontrados</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#617267]">La trazabilidad registrada del lote respalda la preparación documental.</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#405247]">
              <span>{lot.code}</span><ArrowRight size={13} /><span>{destination}</span><span className="mx-1 text-[#b1bcb4]">·</span><span>{formatKg(quantity)}</span>
            </div>
          </div>
        </div>
        <Button onClick={onGenerate}><FileOutput size={15} /> Generar documentación</Button>
      </div>
    </section>
  );
}
