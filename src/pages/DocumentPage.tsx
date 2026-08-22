import { ArrowLeft, Printer } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { DocumentProvenance } from '../components/documents/DocumentProvenance';
import { FacturaTemplate } from '../components/documents/FacturaTemplate';
import { ListaEmpaqueTemplate } from '../components/documents/ListaEmpaqueTemplate';
import { PlanillaConteoTemplate } from '../components/documents/PlanillaConteoTemplate';
import { PlanillaStockTemplate } from '../components/documents/PlanillaStockTemplate';
import { ProformaTemplate } from '../components/documents/ProformaTemplate';
import { RemitoTemplate } from '../components/documents/RemitoTemplate';
import { useAppData } from '../state/AppDataContext';
import { documentOperationId, type DocumentType, type GeneratedDocument } from '../types/export';

const packOrder: DocumentType[] = ['proforma', 'factura', 'lista_empaque', 'remito'];
const packLabel: Record<DocumentType, string> = {
  proforma: 'Proforma',
  factura: 'Factura',
  remito: 'Remito',
  lista_empaque: 'Empaque',
  planilla_stock: 'Stock',
  planilla_conteo: 'Conteo',
};

function snapshotOf(document: GeneratedDocument) {
  return 'snapshot' in document ? document.snapshot : undefined;
}

export function DocumentPage() {
  const { id } = useParams();
  const { generatedDocuments } = useAppData();
  const document = generatedDocuments.find((item) => item.id === id);

  if (!document) return <Navigate to="/documents" replace />;

  const operationId = documentOperationId(document);
  const pack = operationId
    ? generatedDocuments
      .filter((item) => documentOperationId(item) === operationId)
      .sort((left, right) => packOrder.indexOf(left.type) - packOrder.indexOf(right.type))
    : [];

  return (
    <>
      <div className="no-print mb-4 flex items-center justify-between gap-4">
        <Link to="/documents" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#627067] hover:text-[#244a36]"><ArrowLeft size={13} /> Volver a documentos</Link>
        <Button onClick={() => window.print()}><Printer size={14} /> Imprimir / Descargar PDF</Button>
      </div>

      {pack.length > 1 && (
        <nav className="no-print mb-4 flex flex-wrap gap-2" aria-label="Paquete documental">
          {pack.map((item) => (
            <Link
              key={item.id}
              to={`/documents/${item.id}`}
              className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] ${item.id === document.id ? 'border-[#234b37] bg-[#234b37] text-white' : 'border-[#d8dad3] bg-white text-[#5f645d]'}`}
            >
              {packLabel[item.type]}
            </Link>
          ))}
        </nav>
      )}

      <DocumentProvenance snapshot={snapshotOf(document)} />

      {document.type === 'proforma' && <ProformaTemplate document={document} />}
      {document.type === 'factura' && <FacturaTemplate document={document} />}
      {document.type === 'remito' && <RemitoTemplate document={document} />}
      {document.type === 'lista_empaque' && <ListaEmpaqueTemplate document={document} />}
      {document.type === 'planilla_stock' && <PlanillaStockTemplate document={document} />}
      {document.type === 'planilla_conteo' && <PlanillaConteoTemplate document={document} />}
    </>
  );
}
