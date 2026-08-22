import { Boxes, ClipboardClock, PackageCheck, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { StockTable } from '../components/stock/StockTable';
import { formatKg } from '../lib/formatters';
import { getOperationalMetrics } from '../services/stockService';
import { useAppData } from '../state/AppDataContext';

export function DashboardPage() {
  const { stockViews, dataSource } = useAppData();
  const metrics = getOperationalMetrics(stockViews);
  const alerts = stockViews.filter((record) => record.status === 'discrepancy');

  return (
    <>
      <PageHeader
        eyebrow="Centro de control"
        title="Resumen operativo"
        description="Estado consolidado de stock y operaciones que requieren intervención."
        actions={<Link to="/exports/new"><Button>Nueva exportación</Button></Link>}
      />

      <section className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2" aria-label="Métricas operativas">
        <StatCard icon={Boxes} label="Stock total" value={formatKg(metrics.totalStock)} note="Cantidad verificada consolidada" />
        <StatCard icon={PackageCheck} label="Lotes activos" value={String(metrics.activeLots)} note="Campaña 2025/26" />
        <StatCard icon={TriangleAlert} label="Discrepancias" value={String(metrics.discrepancies)} note="Requieren revisión" tone="danger" />
        <StatCard icon={ClipboardClock} label="Exportaciones pendientes" value={String(metrics.pendingExports)} note="Preparación documental" tone="warning" />
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#777c74]">Atención requerida</p>
            <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-[#292e29]">Alertas de stock</h2>
          </div>
          <Link className="text-[11px] font-bold text-[#315d43] hover:underline" to="/stock?status=discrepancy">Ver stock completo →</Link>
        </div>
        <StockTable records={alerts} compact />
      </section>

      <section className="mt-7 grid grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="border border-[#d8dad3] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777c74]">Próxima acción sugerida</p>
          <div className="mt-3 flex items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[#2d332e]">Resolver diferencia del lote A-204</h3>
              <p className="mt-1 text-[11px] leading-5 text-[#747970]">Hay un movimiento pendiente de 1.000 kg que puede explicar la diferencia detectada.</p>
            </div>
            <Link to="/lots/A-204"><Button variant="secondary">Revisar lote</Button></Link>
          </div>
        </div>
        <div className="border border-[#d8dad3] bg-[#eceee8] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7169]">Última consolidación</p>
          <p className="tabular mt-3 text-xl font-semibold text-[#2d342f]">21 AGO · 11:45</p>
          <p className="mt-1 text-[11px] text-[#747970]">{stockViews.length} registros procesados · {dataSource === 'database' ? 'PostgreSQL' : 'fallback mock'}</p>
        </div>
      </section>
    </>
  );
}
