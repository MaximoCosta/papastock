import { formatQuantity } from '../../lib/formatters';
import { aggregateStockByVarietyLocationUnit } from '../../lib/stockAggregation';
import type { StockView } from '../../types/domain';

export function VarietyStockPanel({ records }: { records: StockView[] }) {
  const groups = aggregateStockByVarietyLocationUnit(records);
  if (groups.length === 0) return null;

  return (
    <section className="mb-4 border border-[#d8dad3] bg-white">
      <div className="border-b border-[#e0e2dc] px-5 py-4">
        <h2 className="text-sm font-semibold">Consulta por variedad y ubicación</h2>
        <p className="mt-1 text-[11px] text-[#747a72]">Los kilos y las bolsas no se mezclan en el mismo total.</p>
      </div>
      <div className="divide-y divide-[#e8e9e4]">
        {groups.map((group) => (
          <div key={`${group.locationId}-${group.variety}-${group.unit}`} className="px-5 py-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747970]">{group.locationName}</p>
                <h3 className="mt-1 text-[15px] font-semibold text-[#26362c]">{group.variety}</h3>
              </div>
              <p className="tabular text-[15px] font-bold text-[#315a40]">{formatQuantity(group.totalVerified, group.unit)}</p>
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[#5c665e] max-[800px]:grid-cols-1">
              {group.lots.map((lot) => (
                <li key={lot.lotId} className="flex justify-between border border-[#eceee8] px-3 py-2">
                  <span className="font-semibold">{lot.lotCode}</span>
                  <span className="tabular">{formatQuantity(lot.verifiedQuantity, lot.unit)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
