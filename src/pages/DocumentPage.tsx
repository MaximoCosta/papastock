import { ArrowLeft, Printer } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { FacturaTemplate } from '../components/documents/FacturaTemplate';
import { PlanillaConteoTemplate } from '../components/documents/PlanillaConteoTemplate';
import { PlanillaStockTemplate } from '../components/documents/PlanillaStockTemplate';
import { ProformaTemplate } from '../components/documents/ProformaTemplate';
import { RemitoTemplate } from '../components/documents/RemitoTemplate';
import { useAppData } from '../state/AppDataContext';

export function DocumentPage() {
  const { id } = useParams();
  const { generatedDocuments } = useAppData();
  const document = generatedDocuments.find((item) => item.id === id);

  if (!document) return <Navigate to="/documents" replace />;

  return (
    <>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to="/documents" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#627067] hover:text-[#244a36]"><ArrowLeft size={13} /> Volver a documentos</Link>
        <Button onClick={() => window.print()}><Printer size={14} /> Imprimir / Descargar PDF</Button>
      </div>

      {document.type === 'proforma' && <ProformaTemplate document={document} />}
      {document.type === 'factura' && <FacturaTemplate document={document} />}
      {document.type === 'remito' && <RemitoTemplate document={document} />}
      {document.type === 'planilla_stock' && <PlanillaStockTemplate document={document} />}
      {document.type === 'planilla_conteo' && <PlanillaConteoTemplate document={document} />}
    </>
  );
}
