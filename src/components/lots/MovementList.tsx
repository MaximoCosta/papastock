import { ArrowRight, Minus } from 'lucide-react';
import { formatDate, formatQuantity } from '../../lib/formatters';
import { movementItemsOf, movementPrimaryUnit } from '../../lib/movements';
import type { Location, Movement } from '../../types/domain';
import { StatusBadge } from '../common/StatusBadge';

export function MovementList({ movements, locations }: { movements: Movement[]; locations: Location[] }) {
  return (
    <section className="border border-[#d8dad3] bg-white">
      <div className="border-b border-[#e0e2dc] px-5 py-4">
        <h2 className="text-sm font-semibold">Movimientos recientes</h2>
        <p className="mt-1 text-[11px] text-[#747a72]">Remitos y correcciones vinculadas al lote</p>
      </div>
      <div className="divide-y divide-[#e6e7e2]">
        {movements.map((movement) => {
          const origin = locations.find((item) => item.id === movement.originLocationId)?.name ?? 'Ingreso externo';
          const destination = locations.find((item) => item.id === movement.destinationLocationId)?.name ?? 'Salida externa';
          const tone = movement.status === 'completed' ? 'success' : movement.status === 'pending' ? 'warning' : 'neutral';
          const label = movement.status === 'completed' ? 'Completado' : movement.status === 'pending' ? 'Pendiente' : 'Cancelado';
          const items = movementItemsOf(movement);
          const unit = movementPrimaryUnit(movement);
          return (
            <div key={movement.id} className="grid grid-cols-[120px_1fr_140px_105px] items-center gap-4 px-5 py-3.5 text-[12px]">
              <div>
                <p className="font-bold text-[#304136]">{movement.remitoNumber ? `R ${movement.remitoNumber}` : movement.reference}</p>
                <p className="mt-0.5 text-[10px] text-[#7a7f77]">{movement.reference} · {formatDate(movement.date)}</p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[#5a6059]">
                  <span className="truncate">{origin}</span>
                  <ArrowRight size={13} className="shrink-0 text-[#9b9f98]" />
                  <span className="truncate">{destination}</span>
                </div>
                {items.length > 1 && (
                  <p className="mt-1 text-[10px] text-[#747970]">{items.length} líneas de lote</p>
                )}
              </div>
              <p className="tabular text-right font-semibold">
                {formatQuantity(items.reduce((total, item) => total + item.dispatchedQuantity, 0) || movement.quantity || 0, unit)}
              </p>
              <StatusBadge tone={tone}>{movement.receptionStatus === 'pending' ? 'Por recibir' : label}</StatusBadge>
            </div>
          );
        })}
        {movements.length === 0 && (
          <div className="flex items-center gap-2 px-5 py-8 text-xs text-[#777c74]"><Minus size={14} /> Sin movimientos registrados</div>
        )}
      </div>
    </section>
  );
}
