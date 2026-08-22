import { formatKg } from '../../lib/formatters';
import type { ProformaDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';

export function ProformaTemplate({ document }: { document: ProformaDocument }) {
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
          <p className="mt-1.5 text-[11px] leading-5 text-[#5f665f]">Datos generados a partir de la trazabilidad registrada del lote {document.lotCode} y el perfil del transportista seleccionado.</p>
        </div>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
