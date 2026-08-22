import { formatKg } from '../../lib/formatters';
import type { RemitoDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead, exportItemsOf } from './DocumentChrome';

export function RemitoTemplate({ document }: { document: RemitoDocument }) {
  const items = exportItemsOf(document);

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Remito" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-3 gap-8">
          <div>
            <p className="label">Origen</p>
            <p className="text-[13px] font-semibold leading-5">{document.originLocation}</p>
          </div>
          <div>
            <p className="label">Destino</p>
            <p className="text-[13px] font-semibold leading-5">{document.destinationLocation}</p>
          </div>
          <div>
            <p className="label">Transportista</p>
            <p className="text-[13px] font-semibold leading-5">{document.transporter || 'No informado'}</p>
            {document.transporterCuit && (
              <p className="mt-1 text-[11px] text-[#737970]">{document.transporterCuit}</p>
            )}
          </div>
        </div>

        {(document.transporterPlate || document.transporterVehicle || document.transporterContact) && (
          <div className="mb-8 grid grid-cols-3 gap-6 border border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[11px]">
            <div>
              <p className="label">Patente</p>
              <p className="mt-0.5 font-semibold tabular">{document.transporterPlate || '—'}</p>
            </div>
            <div>
              <p className="label">Vehículo</p>
              <p className="mt-0.5 font-semibold">{document.transporterVehicle || '—'}</p>
            </div>
            <div>
              <p className="label">Chofer / contacto</p>
              <p className="mt-0.5 font-semibold">{document.transporterContact || '—'}</p>
              {document.transporterPhone && <p className="mt-0.5 text-[#737970]">{document.transporterPhone}</p>}
            </div>
          </div>
        )}

        <div className="border-y border-[#cfd2ca]">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr] border-b border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#70766e]">
            <span>Lote</span><span>Variedad</span><span>Referencia</span><span className="text-right">Cantidad</span>
          </div>
          {items.map((item) => (
            <div key={item.lotId} className="grid grid-cols-[1fr_1.2fr_1fr_1fr] border-b border-[#eceee8] px-4 py-4 text-[13px] font-semibold text-[#2d332e] last:border-b-0">
              <span>{item.lotCode}</span>
              <span>{item.variety}</span>
              <span>{document.dispatchReference}</span>
              <span className="tabular text-right">{formatKg(item.quantity)}</span>
            </div>
          ))}
          {items.length > 1 && (
            <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr] border-t border-[#cfd2ca] bg-[#f6f7f3] px-4 py-3 text-[13px] font-bold text-[#25412f]">
              <span className="col-span-3">Total ({items.length} lotes)</span>
              <span className="tabular text-right">{formatKg(document.quantity)}</span>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-12">
          <div className="border-t border-[#c6cac0] pt-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Despacha</p>
            <p className="mt-1 text-[10px] text-[#9a9e96]">Firma y aclaración</p>
          </div>
          <div className="border-t border-[#c6cac0] pt-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Recibe conforme</p>
            <p className="mt-1 text-[10px] text-[#9a9e96]">Firma y aclaración</p>
          </div>
        </div>

        <div className="mt-12 border-l-[3px] border-[#607c67] bg-[#f1f4ef] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#657068]">Origen de datos</p>
          <p className="mt-1.5 text-[11px] leading-5 text-[#5f665f]">
            Remito generado a partir del despacho validado de {items.length === 1 ? `el lote ${items[0].lotCode}` : `los lotes ${items.map((item) => item.lotCode).join(', ')}`} y el perfil del transportista.
          </p>
        </div>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
