import { ArrowRight, ClipboardCheck, ClipboardList, FileText, Plus, Receipt, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate } from '../lib/formatters';
import { useAppData } from '../state/AppDataContext';
import type { DocumentType, GeneratedDocument } from '../types/export';

const typeMeta: Record<DocumentType, { label: string; icon: ReactNode }> = {
  proforma: { label: 'Proforma', icon: <FileText size={14} /> },
  factura: { label: 'Factura', icon: <Receipt size={14} /> },
  remito: { label: 'Remito', icon: <Truck size={14} /> },
  planilla_stock: { label: 'Planilla de stock', icon: <ClipboardList size={14} /> },
  planilla_conteo: { label: 'Planilla de conteo', icon: <ClipboardCheck size={14} /> },
};

function summarize(document: GeneratedDocument): { lot: string; detail: string } {
  switch (document.type) {
    case 'proforma':
    case 'factura':
      return { lot: document.lotCode, detail: document.destinationCountry };
    case 'remito':
      return { lot: document.lotCode, detail: `${document.originLocation} → ${document.destinationLocation}` };
    case 'planilla_stock':
    case 'planilla_conteo':
      return { lot: `${document.rows.length} lotes`, detail: document.scope };
  }
}

export function DocumentsPage() {
  const { generatedDocuments } = useAppData();
  return (
    <>
      <PageHeader
        eyebrow="Archivo operativo"
        title="Documentos"
        description="Proformas, facturas, remitos y planillas generadas desde datos operativos validados."
        actions={<Link to="/exports/new"><Button><Plus size={14} /> Nueva exportación</Button></Link>}
      />
      {generatedDocuments.length === 0 ? (
        <EmptyState
          title="Todavía no hay documentos"
          description="Generá una proforma, factura, remito o planilla desde las páginas de exportación, lote o stock."
          action={<Link to="/exports/new"><Button>Preparar exportación</Button></Link>}
        />
      ) : (
        <div className="overflow-hidden border border-[#d8dad3] bg-white">
          <table className="operational-table">
            <thead><tr><th>Documento</th><th>Tipo</th><th>Lote</th><th>Detalle</th><th>Fecha</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
            <tbody>
              {generatedDocuments.map((document, index) => {
                const meta = typeMeta[document.type];
                const summary = summarize(document);
                return (
                  <tr key={document.id} className="anim-row" style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}>
                    <td><Link to={`/documents/${document.id}`} className="flex items-center gap-2 font-bold text-[#284332] hover:underline">{meta.icon}{document.id}</Link></td>
                    <td>{meta.label}</td>
                    <td>{summary.lot}</td>
                    <td>{summary.detail}</td>
                    <td className="tabular">{formatDate(document.createdAt)}</td>
                    <td><StatusBadge tone="success">Generado</StatusBadge></td>
                    <td className="w-12 text-right!"><Link to={`/documents/${document.id}`} aria-label={`Abrir ${document.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-[#667068] hover:bg-[#eef0eb]"><ArrowRight size={15} /></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
