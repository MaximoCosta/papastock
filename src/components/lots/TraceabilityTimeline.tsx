import { formatCompactDate } from '../../lib/formatters';
import type { TraceabilityEvent, TraceabilityEventType } from '../../types/domain';

const eventLabels: Record<TraceabilityEventType, string> = {
  planting: 'Plantación',
  harvest: 'Cosecha',
  treatment: 'Tratamiento fitosanitario',
  quality_control: 'Control de calidad',
  stock_verification: 'Verificación de stock',
};

function getDetail(event: TraceabilityEvent): string {
  if (event.type === 'treatment') return String(event.data.product ?? 'Producto no informado');
  if (event.type === 'planting') return String(event.data.plot ?? event.data.seedBatch ?? 'Registro de campo');
  if (event.type === 'harvest') return event.data.netWeight ? `${Number(event.data.netWeight).toLocaleString('es-AR')} kg ingresados` : 'Cosecha registrada';
  if (event.type === 'quality_control') return String(event.data.result ?? 'Control registrado');
  if (event.type === 'stock_verification') return event.data.verifiedQuantity ? `${Number(event.data.verifiedQuantity).toLocaleString('es-AR')} kg verificados` : 'Control registrado';
  return 'Evento registrado';
}

export function TraceabilityTimeline({ events }: { events: TraceabilityEvent[] }) {
  const ordered = [...events].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="border border-[#d8dad3] bg-white">
      <div className="border-b border-[#e0e2dc] px-5 py-4">
        <h2 className="text-sm font-semibold">Trazabilidad</h2>
        <p className="mt-1 text-[11px] text-[#747a72]">Cadena cronológica del lote</p>
      </div>
      <div className="px-5 py-2">
        {ordered.map((event, index) => (
          <div key={event.id} className="grid grid-cols-[64px_20px_1fr] gap-2">
            <time className="tabular pt-[17px] text-[10px] font-bold tracking-[0.04em] text-[#777d74]">{formatCompactDate(event.date)}</time>
            <div className="relative flex justify-center">
              {index < ordered.length - 1 && <span className="absolute bottom-0 top-[23px] w-px bg-[#d7dbd3]" />}
              <span className={`relative mt-[19px] h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ${event.type === 'treatment' ? 'bg-[#a6711b] ring-[#c99b4e]' : 'bg-[#3b674c] ring-[#6e8f78]'}`} />
            </div>
            <div className="border-b border-[#e8e9e5] py-3.5 last:border-0">
              <p className="text-[12px] font-semibold text-[#323732]">{eventLabels[event.type]}</p>
              <p className="mt-1 text-[11px] text-[#777c74]">{getDetail(event)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
