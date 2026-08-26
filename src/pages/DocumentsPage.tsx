import { ArrowRight, ClipboardCheck, ClipboardList, FileText, Package, Plus, Receipt, Truck } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatKg } from '../lib/formatters';
import { useAppData } from '../state/AppDataContext';
import type { DocumentType, GeneratedDocument } from '../types/export';

const typeMeta: Record<DocumentType, { label: string; icon: ReactNode }> = {
  proforma: { label: 'Proforma', icon: <FileText size={14} /> },
  factura: { label: 'Factura', icon: <Receipt size={14} /> },
  remito: { label: 'Remito', icon: <Truck size={14} /> },
  lista_empaque: { label: 'Lista de empaque', icon: <Package size={14} /> },
  planilla_stock: { label: 'Planilla de stock', icon: <ClipboardList size={14} /> },
  planilla_conteo: { label: 'Planilla de conteo', icon: <ClipboardCheck size={14} /> },
};

const filters: Array<{ id: 'all' | DocumentType; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'proforma', label: 'Proforma' },
  { id: 'factura', label: 'Factura' },
  { id: 'lista_empaque', label: 'Empaque' },
  { id: 'remito', label: 'Remito' },
  { id: 'planilla_stock', label: 'Stock' },
  { id: 'planilla_conteo', label: 'Conteo' },
];

function summarize(document: GeneratedDocument): { lot: string; detail: string; quantity?: string } {
  switch (document.type) {
    case 'proforma':
    case 'factura':
    case 'lista_empaque':
      return {
        lot: document.lotCode,
        detail: document.buyerName ? `${document.buyerName} · ${document.destinationCountry}` : document.destinationCountry,
        quantity: formatKg(document.quantity),
      };
    case 'remito':
      return {
        lot: document.lotCode,
        detail: `${document.originLocation} → ${document.destinationLocation}`,
        quantity: formatKg(document.quantity),
      };
    case 'planilla_stock':
    case 'planilla_conteo':
      return { lot: `${document.rows.length} lotes`, detail: document.scope };
  }
}

export function DocumentsPage() {
  const { generatedDocuments } = useAppData();
  const [filter, setFilter] = useState<'all' | DocumentType>('all');
  const visible = useMemo(
    () => generatedDocuments.filter((document) => filter === 'all' || document.type === filter),
    [filter, generatedDocuments],
  );

  return (
    <>
      <PageHeader
        eyebrow="Archivo operativo"
        title="Documentos"
        description="Proformas, facturas, listas de empaque, remitos y planillas generadas desde datos operativos validados."
        actions={<Link to="/exports/new"><Button><Plus size={14} /> Nueva exportación</Button></Link>}
      />

      <div className="mb-4 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
        <Link to="/exports/new" className="border border-[#d8dad3] bg-white px-4 py-3 hover:border-[#b8cfbd]">
          <p className="text-[11px] font-semibold text-[#284332]">Paquete de exportación</p>
          <p className="mt-1 text-[10px] leading-4 text-[#747970]">Proforma, factura, lista de empaque y remito a partir de lotes validados.</p>
        </Link>
        <Link to="/stock" className="border border-[#d8dad3] bg-white px-4 py-3 hover:border-[#b8cfbd]">
          <p className="text-[11px] font-semibold text-[#284332]">Planilla de stock</p>
          <p className="mt-1 text-[10px] leading-4 text-[#747970]">Emití el consolidado filtrado desde el inventario operativo.</p>
        </Link>
        <Link to="/stock/control" className="border border-[#d8dad3] bg-white px-4 py-3 hover:border-[#b8cfbd]">
          <p className="text-[11px] font-semibold text-[#284332]">Planilla de conteo</p>
          <p className="mt-1 text-[10px] leading-4 text-[#747970]">Hoja para control físico por ubicación o estantería.</p>
        </Link>
      </div>

      {generatedDocuments.length === 0 ? (
        <EmptyState
          title="Todavía no hay documentos"
          description="Generá el paquete de exportación o una planilla desde stock. Los documentos de esta sesión quedan en el navegador."
          action={<Link to="/exports/new"><Button>Preparar exportación</Button></Link>}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`min-h-8 border px-3 text-[10px] font-bold uppercase tracking-[0.06em] ${filter === item.id ? 'border-[#234b37] bg-[#234b37] text-white' : 'border-[#d8dad3] bg-white text-[#5f645d]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden border border-[#d8dad3] bg-white">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Documento</th><th>Tipo</th><th>Lote</th><th>Detalle</th><th>Cantidad</th><th>Fecha</th><th>Estado</th><th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visible.map((document, index) => {
                  const meta = typeMeta[document.type];
                  const summary = summarize(document);
                  return (
                    <tr key={document.id} className="anim-row" style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}>
                      <td><Link to={`/documents/${document.id}`} className="flex items-center gap-2 font-bold text-[#284332] hover:underline">{meta.icon}{document.id}</Link></td>
                      <td>{meta.label}</td>
                      <td>{summary.lot}</td>
                      <td>{summary.detail}</td>
                      <td className="tabular">{summary.quantity ?? '—'}</td>
                      <td className="tabular">{formatDate(document.createdAt)}</td>
                      <td><StatusBadge tone="success">Generado</StatusBadge></td>
                      <td className="w-12 text-right!"><Link to={`/documents/${document.id}`} aria-label={`Abrir ${document.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-[#667068] hover:bg-[#eef0eb]"><ArrowRight size={15} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
