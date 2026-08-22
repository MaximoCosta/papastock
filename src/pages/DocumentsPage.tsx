import { ArrowRight, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatKg } from '../lib/formatters';
import { useAppData } from '../state/AppDataContext';

export function DocumentsPage() {
  const { generatedDocuments } = useAppData();
  return (
    <>
      <PageHeader
        eyebrow="Archivo operativo"
        title="Documentos"
        description="Proformas generadas desde trazabilidad validada."
        actions={<Link to="/exports/new"><Button><Plus size={14} /> Nueva exportación</Button></Link>}
      />
      {generatedDocuments.length === 0 ? (
        <EmptyState
          title="Todavía no hay documentos"
          description="Completá el análisis de una exportación para generar la primera proforma."
          action={<Link to="/exports/new"><Button>Preparar exportación</Button></Link>}
        />
      ) : (
        <div className="overflow-hidden border border-[#d8dad3] bg-white">
          <table className="operational-table">
            <thead><tr><th>Documento</th><th>Lote</th><th>Destino</th><th>Cantidad</th><th>Fecha</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
            <tbody>
              {generatedDocuments.map((document) => (
                <tr key={document.id}>
                  <td><Link to={`/documents/${document.id}`} className="flex items-center gap-2 font-bold text-[#284332] hover:underline"><FileText size={14} />{document.id}</Link></td>
                  <td>{document.lotCode}</td>
                  <td>{document.destinationCountry}</td>
                  <td className="tabular">{formatKg(document.quantity)}</td>
                  <td className="tabular">{formatDate(document.createdAt)}</td>
                  <td><StatusBadge tone="success">Generado</StatusBadge></td>
                  <td className="w-12 text-right!"><Link to={`/documents/${document.id}`} aria-label={`Abrir ${document.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-[#667068] hover:bg-[#eef0eb]"><ArrowRight size={15} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

