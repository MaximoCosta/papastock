import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { formatDate, formatKg } from '../lib/formatters';
import { useAppData } from '../state/AppDataContext';

export function ProformaPage() {
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

      <article className="print-document mx-auto max-w-[960px] border border-[#cfd2ca] bg-white shadow-[0_8px_28px_rgba(38,46,40,0.08)]">
        <header className="flex items-start justify-between border-b-2 border-[#234b37] px-12 py-10">
          <div>
            <p className="text-[26px] font-bold tracking-[-0.035em] text-[#193c2b]">PAPASUD</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#7a8179]">Producción y comercialización</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8078]">Proforma invoice</p>
            <p className="tabular mt-2 text-[15px] font-semibold text-[#2a302b]">{document.id}</p>
            <p className="mt-1 text-[10px] text-[#7a8078]">Emitida el {formatDate(document.createdAt)}</p>
          </div>
        </header>

        <div className="px-12 py-10">
          <div className="mb-9 grid grid-cols-2 gap-12">
            <div>
              <p className="label">Exportador</p>
              <p className="text-[14px] font-semibold">{document.exporter}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#737970]">Balcarce, Buenos Aires<br />República Argentina</p>
            </div>
            <div>
              <p className="label">Destino</p>
              <p className="text-[14px] font-semibold">{document.destinationCountry}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#737970]">Operación comercial de demostración<br />Documento no fiscal</p>
            </div>
          </div>

          <div className="border-y border-[#cfd2ca]">
            <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr] border-b border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#70766e]">
              <span>Lote</span><span>Variedad</span><span>Campaña</span><span className="text-right">Cantidad neta</span>
            </div>
            <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr] px-4 py-5 text-[13px] font-semibold text-[#2d332e]">
              <span>{document.lotCode}</span><span>{document.variety}</span><span>{document.campaign}</span><span className="tabular text-right">{formatKg(document.quantity)}</span>
            </div>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-x-12 gap-y-7">
            <div><dt className="label">Origen</dt><dd className="text-[12px] leading-5 text-[#333832]">{document.origin}</dd></div>
            <div><dt className="label">Tratamiento fitosanitario</dt><dd className="text-[12px] leading-5 text-[#333832]">{document.treatment}</dd></div>
          </dl>

          <div className="mt-12 border-l-[3px] border-[#607c67] bg-[#f1f4ef] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#657068]">Origen de datos</p>
            <p className="mt-1.5 text-[11px] leading-5 text-[#5f665f]">Datos generados a partir de la trazabilidad registrada del lote {document.lotCode}. La información fue confirmada por el operador antes de emitir este documento.</p>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-[#dfe1da] px-12 py-5 text-[9px] uppercase tracking-[0.06em] text-[#858a82]">
          <span>PapaStock · Papasud</span>
          <span className="flex items-center gap-1.5"><Download size={11} /> Documento de demostración</span>
        </footer>
      </article>
    </>
  );
}

