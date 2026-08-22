import { formatKg } from '../../lib/formatters';
import type { ProformaDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead, exportItemsOf } from './DocumentChrome';

export function ProformaTemplate({ document }: { document: ProformaDocument }) {
  const items = exportItemsOf(document);

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Proforma invoice" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-2 gap-12">
          <div>
            <p className="label">Exportador</p>
            <p className="text-[14px] font-semibold">{document.exporter}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#737970]">Balcarce, Buenos Aires<br />República Argentina</p>
          </div>
          <div>
            <p className="label">Destino / comprador</p>
            <p className="text-[14px] font-semibold">{document.buyerName || document.destinationCountry}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#737970]">
              {document.destinationCountry}
              {document.arrivalPort ? ` · ${document.arrivalPort}` : ''}
              <br />
              {document.incoterm ? `Incoterm ${document.incoterm}` : 'Operación comercial de demostración'}
            </p>
          </div>
        </div>

        <div className="border-y border-[#cfd2ca]">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1.4fr_1fr] border-b border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#70766e]">
            <span>Lote</span><span>Variedad</span><span>Campaña</span><span>Tratamiento</span><span className="text-right">Cantidad neta</span>
          </div>
          {items.map((item) => (
            <div key={item.lotId} className="grid grid-cols-[1fr_1.2fr_1fr_1.4fr_1fr] border-b border-[#eceee8] px-4 py-4 text-[13px] font-semibold text-[#2d332e] last:border-b-0">
              <span>{item.lotCode}</span>
              <span>{item.variety}</span>
              <span>{item.campaign}</span>
              <span className="text-[11px] font-medium leading-4 text-[#4b514a]">{item.treatment ?? 'No informado'}</span>
              <span className="tabular text-right">{formatKg(item.quantity)}</span>
            </div>
          ))}
          {items.length > 1 && (
            <div className="grid grid-cols-[1fr_1.2fr_1fr_1.4fr_1fr] border-t border-[#cfd2ca] bg-[#f6f7f3] px-4 py-3 text-[13px] font-bold text-[#25412f]">
              <span className="col-span-4">Total ({items.length} lotes)</span>
              <span className="tabular text-right">{formatKg(document.quantity)}</span>
            </div>
          )}
        </div>

        <dl className="mt-9 grid grid-cols-2 gap-x-12 gap-y-7">
          <div className="border-l-2 border-[#dbb488] pl-3"><dt className="label text-[#96552b]!">Origen</dt><dd className="text-[12px] leading-5 text-[#333832]">{document.origin}</dd></div>
          <div><dt className="label">Tratamiento fitosanitario</dt><dd className="text-[12px] leading-5 text-[#333832]">{document.treatment}</dd></div>
          <div><dt className="label">Puerto de salida</dt><dd className="text-[12px] leading-5 text-[#333832]">{document.departurePort || '—'}</dd></div>
          <div><dt className="label">Fecha de despacho</dt><dd className="text-[12px] leading-5 text-[#333832]">{document.departureDate || '—'}</dd></div>
          {document.transporterName && (
            <>
              <div>
                <dt className="label">Transportista</dt>
                <dd className="text-[12px] leading-5 text-[#333832]">
                  {document.transporterName}
                  {document.transporterCuit ? ` · ${document.transporterCuit}` : ''}
                </dd>
              </div>
              <div>
                <dt className="label">Vehículo</dt>
                <dd className="text-[12px] leading-5 text-[#333832]">
                  {document.transporterVehicle || '—'}
                  {document.transporterPlate ? ` · ${document.transporterPlate}` : ''}
                </dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-12 border-l-[3px] border-[#607c67] bg-[#f1f4ef] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#657068]">Origen de datos</p>
          <p className="mt-1.5 text-[11px] leading-5 text-[#5f665f]">
            Datos generados a partir de la trazabilidad registrada de {items.length === 1 ? `el lote ${items[0].lotCode}` : `los lotes ${items.map((item) => item.lotCode).join(', ')}`} y el perfil del transportista seleccionado.
          </p>
        </div>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
