import { ArrowRight, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { lots } from '../data/lots';
import { formatDate } from '../lib/formatters';
import { getStockViewByLotId } from '../services/stockService';
import { StockStatusBadge } from '../components/stock/StockStatusBadge';

export function LotsPage() {
  return (
    <>
      <PageHeader eyebrow="Trazabilidad" title="Lotes productivos" description="Origen, campaña y situación operativa de cada unidad trazable." />
      <div className="overflow-hidden border border-[#d8dad3] bg-white">
        <table className="operational-table">
          <thead>
            <tr><th>Lote</th><th>Variedad</th><th>Productor</th><th>Origen</th><th>Cosecha</th><th>Estado</th><th aria-label="Acciones" /></tr>
          </thead>
          <tbody>
            {lots.map((lot) => {
              const stock = getStockViewByLotId(lot.id);
              return (
                <tr key={lot.id}>
                  <td><Link className="font-bold text-[#284332] hover:underline" to={`/lots/${lot.code}`}>{lot.code}</Link></td>
                  <td>{lot.variety}</td>
                  <td>{lot.producer}</td>
                  <td className="max-w-[260px] truncate">{lot.origin}</td>
                  <td className="tabular">{lot.harvestDate ? formatDate(lot.harvestDate) : '—'}</td>
                  <td>{stock && <StockStatusBadge status={stock.status} />}</td>
                  <td className="w-12 text-right!"><Link to={`/lots/${lot.code}`} aria-label={`Abrir lote ${lot.code}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-[#667068] hover:bg-[#eef0eb]"><ArrowRight size={15} /></Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex h-10 items-center gap-2 border-t border-[#e2e4de] bg-[#fafaf7] px-4 text-[10px] text-[#747970]"><PackageSearch size={13} /> {lots.length} lotes activos · Campaña 2025/26</div>
      </div>
    </>
  );
}
