import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { StockTable } from '../components/stock/StockTable';
import { useAppData } from '../state/AppDataContext';
import type { StockStatus } from '../types/domain';

export function StockPage() {
  const { locations, stockViews } = useAppData();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [locationId, setLocationId] = useState('all');
  const [status, setStatus] = useState<StockStatus | 'all'>(() => {
    const initial = searchParams.get('status');
    return initial === 'verified' || initial === 'discrepancy' || initial === 'pending' ? initial : 'all';
  });

  const records = useMemo(() => stockViews.filter((record) => {
    const matchesQuery = record.lot.code.toLowerCase().includes(query.trim().toLowerCase());
    const matchesLocation = locationId === 'all' || record.locationId === locationId;
    const matchesStatus = status === 'all' || record.status === status;
    return matchesQuery && matchesLocation && matchesStatus;
  }), [locationId, query, status, stockViews]);

  return (
    <>
      <PageHeader eyebrow="Inventario" title="Stock consolidado" description="Comparación operativa entre cantidades declaradas y verificadas por lote." />
      <section className="mb-4 border border-[#d8dad3] bg-white p-3">
        <div className="grid grid-cols-[minmax(240px,1fr)_220px_190px_auto] items-center gap-3">
          <label className="relative">
            <span className="sr-only">Buscar por lote</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737970]" />
            <input className="field min-h-10 pl-9 text-[12px]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lote..." />
          </label>
          <label>
            <span className="sr-only">Filtrar por ubicación</span>
            <select className="field min-h-10 text-[12px]" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="all">Todas las ubicaciones</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select className="field min-h-10 text-[12px]" value={status} onChange={(event) => setStatus(event.target.value as StockStatus | 'all')}>
              <option value="all">Todos los estados</option>
              <option value="verified">Verificado</option>
              <option value="discrepancy">Discrepancia</option>
              <option value="pending">Pendiente</option>
            </select>
          </label>
          <div className="flex items-center justify-end gap-2 px-2 text-[10px] font-semibold text-[#747970]">
            <Filter size={13} /> {records.length} de {stockViews.length}
          </div>
        </div>
      </section>
      <StockTable records={records} />
    </>
  );
}
