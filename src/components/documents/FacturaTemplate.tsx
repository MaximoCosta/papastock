import { formatCurrency, formatKg } from '../../lib/formatters';
import type { FacturaDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';

export function FacturaTemplate({ document }: { document: FacturaDocument }) {
  const subtotal = document.quantity * document.unitPrice;

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Factura" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-2 gap-12">
          <div>
            <p className="label">Vendedor</p>
            <p className="text-[14px] font-semibold">{document.exporter}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#737970]">Balcarce, Buenos Aires<br />República Argentina</p>
          </div>
          <div>
            <p className="label">Comprador / destino</p>
            <p className="text-[14px] font-semibold">{document.buyerName || document.destinationCountry}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#737970]">
              {document.destinationCountry}
              {document.incoterm ? ` · ${document.incoterm}` : ''}
              <br />
              {document.transporterName ? `Transportista: ${document.transporterName}` : 'Operación comercial de demostración'}
            </p>
          </div>
        </div>

        <div className="border-y border-[#cfd2ca]">
          <div className="grid grid-cols-[1fr_1fr_0.9fr_0.9fr_0.9fr] border-b border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#70766e]">
            <span>Lote</span><span>Variedad</span><span className="text-right">Cantidad</span><span className="text-right">Precio unit.</span><span className="text-right">Subtotal</span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_0.9fr_0.9fr_0.9fr] px-4 py-5 text-[13px] font-semibold text-[#2d332e]">
            <span>{document.lotCode}</span>
            <span>{document.variety}</span>
            <span className="tabular text-right">{formatKg(document.quantity)}</span>
            <span className="tabular text-right">{document.currency} {formatCurrency(document.unitPrice)}</span>
            <span className="tabular text-right">{document.currency} {formatCurrency(subtotal)}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-[260px] border border-[#cfd2ca]">
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Campaña</span><span className="font-semibold">{document.campaign}</span>
            </div>
            <div className="flex items-center justify-between bg-[#f1f4ef] px-4 py-3 text-[13px] font-bold text-[#25412f]">
              <span>Total</span><span className="tabular">{document.currency} {formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 border-l-[3px] border-[#607c67] bg-[#f1f4ef] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#657068]">Aclaración</p>
          <p className="mt-1.5 text-[11px] leading-5 text-[#5f665f]">Comprobante generado para la demostración del flujo operativo. No constituye un documento fiscal válido.</p>
        </div>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
