import {
  ArrowRight,
  Boxes,
  ClipboardClock,
  ClipboardList,
  FileText,
  PackageCheck,
  PackageSearch,
  Route,
  TriangleAlert,
  Truck,
  Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { StockTable } from '../components/stock/StockTable';
import { formatKg } from '../lib/formatters';
import { getOperationalMetrics } from '../services/stockService';
import { useAppData } from '../state/AppDataContext';

interface QuickAccessItem {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export function DashboardPage() {
  const { stockViews, lots, movements, transporters, generatedDocuments, dataSource } = useAppData();
  const metrics = getOperationalMetrics(stockViews);
  const alerts = stockViews.filter((record) => record.status === 'discrepancy');

  const quickAccess: QuickAccessItem[] = [
    { to: '/stock', label: 'Stock', description: `${stockViews.length} registros consolidados`, icon: Boxes },
    { to: '/lots', label: 'Lotes', description: `${lots.length} lotes con trazabilidad`, icon: PackageSearch },
    { to: '/movements/new', label: 'Mover stock', description: `${movements.length} movimientos registrados`, icon: Route },
    { to: '/transporters', label: 'Transportistas', description: `${transporters.filter((item) => item.active).length} activos`, icon: Truck },
    { to: '/exports/new', label: 'Exportaciones', description: 'Preparar nueva operación', icon: ClipboardList },
    { to: '/documents', label: 'Documentos', description: `${generatedDocuments.length} generados`, icon: FileText },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Centro de control"
        title="Resumen operativo"
        description="Estado consolidado de stock y operaciones que requieren intervención."
        actions={(
          <div className="flex items-center gap-2">
            <Link to="/stock"><Button variant="secondary"><Upload size={14} /> Subir archivo</Button></Link>
            <Link to="/exports/new"><Button>Nueva exportación</Button></Link>
          </div>
        )}
      />

      <section className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2" aria-label="Métricas operativas">
        <StatCard icon={Boxes} label="Stock total" value={formatKg(metrics.totalStock)} note="Cantidad verificada consolidada" />
        <StatCard icon={PackageCheck} label="Lotes activos" value={String(metrics.activeLots)} note="Campaña 2025/26" />
        <StatCard icon={TriangleAlert} label="Discrepancias" value={String(metrics.discrepancies)} note="Requieren revisión" tone="danger" />
        <StatCard icon={ClipboardClock} label="Exportaciones pendientes" value={String(metrics.pendingExports)} note="Preparación documental" tone="warning" />
      </section>

      <section className="mt-7">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.11em] text-[#777c74]">Accesos rápidos</p>
        <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2">
          {quickAccess.map(({ to, label, description, icon: Icon }, index) => (
            <Link
              key={to}
              to={to}
              className="anim-row group flex items-center gap-3 border border-[#d9dbd4] bg-white p-4 transition-colors hover:border-[#8fa896] hover:bg-[#f6f8f5]"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d8dad3] bg-[#f4f5f1] text-[#315d43] group-hover:border-[#a9c0ad] group-hover:bg-white">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#242822]">{label}</p>
                <p className="mt-0.5 truncate text-[11px] text-[#767b73]">{description}</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-[#9aa19a] transition-transform group-hover:translate-x-0.5 group-hover:text-[#315d43]" />
            </Link>
          ))}
        </div>
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
