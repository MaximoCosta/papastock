import { formatKg, formatNumber } from '../../lib/formatters';
import type { Shelf, ShelfUnit, StockView } from '../../types/domain';

export function ShelfGrid({
  shelves,
  shelfUnits,
  stockViews,
}: {
  shelves: Shelf[];
  shelfUnits?: ShelfUnit[];
  stockViews: StockView[];
}) {
  if (shelves.length === 0) {
    return <p className="px-4 py-6 text-[12px] text-[#747970]">Sin estanterías cargadas en esta ubicación.</p>;
  }

  const units = shelfUnits ?? [];
  const grouped = units.length > 0
    ? units.map((unit) => ({
        key: unit.id,
        title: unit.code,
        subtitle: unit.label,
        levels: shelves.filter((shelf) => shelf.shelfUnitId === unit.id).sort((a, b) => a.level - b.level),
      }))
    : [{
        key: 'flat',
        title: 'Estantes',
        subtitle: 'Sin agrupación por unidad',
        levels: shelves,
      }];

  return (
    <div className="grid grid-cols-3 gap-2 p-3 max-[900px]:grid-cols-2">
      {grouped.map((group) => {
        const lots = stockViews.filter((record) => group.levels.some((shelf) => shelf.id === record.shelfId));
        const occupied = lots.reduce(
          (sum, record) => sum + (record.verificationPending ? record.declaredQuantity : record.verifiedQuantity),
          0,
        );
        const capacity = group.levels.reduce((sum, shelf) => sum + (shelf.capacityKg ?? 0), 0);
        const ratio = capacity > 0 ? Math.min(1, occupied / capacity) : 0;

        return (
          <div key={group.key} className="border border-[#dde0d8] bg-[#fafaf7] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-bold tabular text-[#284332]">{group.title}</p>
                <p className="mt-0.5 text-[10px] text-[#747970]">{group.subtitle}</p>
              </div>
              <p className="text-[10px] font-semibold text-[#5f645d]">
                {group.levels.length} est. · {lots.length} lote{lots.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden bg-[#e4e6e0]">
              <div className="h-full bg-[#3d6b4f]" style={{ width: `${ratio * 100}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] tabular text-[#6b7169]">
              {formatKg(occupied)}
              {capacity > 0 ? ` / ${formatNumber(capacity)} kg` : ''}
            </p>
            <ul className="mt-2 space-y-0.5">
              {group.levels.map((shelf) => {
                const shelfLots = stockViews.filter((record) => record.shelfId === shelf.id);
                return (
                  <li key={shelf.id} className="truncate text-[10px] text-[#50564f]">
                    <span className="font-semibold">{shelf.code}</span>
                    {' · N'}
                    {shelf.level}
                    {shelfLots.length > 0 ? ` · ${shelfLots.map((r) => r.lot.code).join(', ')}` : ' · vacío'}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
