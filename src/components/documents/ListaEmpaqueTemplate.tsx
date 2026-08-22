import { formatKg } from '../../lib/formatters';
import type { ListaEmpaqueDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';
import { DocumentNotice, PartyBlock, SignatureRow, fallbackItems } from './DocumentSections';

export function ListaEmpaqueTemplate({ document }: { document: ListaEmpaqueDocument }) {
  const items = fallbackItems(document);
  const totalBags = document.bagCount ?? items.reduce((sum, item) => sum + (item.bagCount ?? 0), 0);
  const net = document.netWeightKg ?? document.quantity;
  const gross = document.grossWeightKg ?? document.quantity;
  const tare = document.tareKg ?? Math.max(0, gross - net);

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Lista de empaque" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-2 gap-12">
          <PartyBlock
            title="Exportador"
            name={document.exporter}
            lines={[document.exporterAddress, document.exporterCity, document.exporterTaxId ? `CUIT ${document.exporterTaxId}` : undefined]}
          />
          <PartyBlock
            title="Consignatario"
            name={document.buyerName || document.destinationCountry}
            lines={[document.buyerAddress, document.buyerCity, document.destinationCountry, document.destinationLocation]}
          />
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4 border border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[11px]">
          <div>
            <p className="label">Marcas</p>
            <p className="mt-0.5 font-semibold">{document.shippingMarks || '—'}</p>
          </div>
          <div>
            <p className="label">Envase</p>
            <p className="mt-0.5 font-semibold">{document.packaging || '—'}{document.bagWeightKg ? ` · ${document.bagWeightKg} kg` : ''}</p>
          </div>
          <div>
            <p className="label">Calibre / categoría</p>
            <p className="mt-0.5 font-semibold">{[document.caliber, document.category].filter(Boolean).join(' · ') || '—'}</p>
          </div>
          <div>
            <p className="label">NCM / HS</p>
            <p className="mt-0.5 font-semibold tabular">{document.hsCode || '—'}</p>
          </div>
        </div>

        <table className="operational-table w-full">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Descripción</th>
              <th>Origen</th>
              <th className="text-right!">Bultos</th>
              <th className="text-right!">Kg / bulto</th>
              <th className="text-right!">Neto</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.lotId || item.lotCode}>
                <td className="font-bold text-[#284332]">{item.lotCode}</td>
                <td>
                  {document.category || 'Semilla de papa'} · {item.variety}
                  {item.packingHomogeneous === false && item.lastBagKg ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-[#7a8078]">Último bulto {formatKg(item.lastBagKg)}</span>
                  ) : null}
                </td>
                <td className="text-[11px]">{item.origin}</td>
                <td className="tabular text-right!">{item.bagCount ?? '—'}</td>
                <td className="tabular text-right!">{document.bagWeightKg ? formatKg(document.bagWeightKg) : '—'}</td>
                <td className="tabular text-right!">{formatKg(item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-[300px] border border-[#cfd2ca]">
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Total bultos</span><span className="tabular font-semibold">{totalBags}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Tara</span><span className="tabular font-semibold">{formatKg(tare)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Peso neto</span><span className="tabular font-semibold">{formatKg(net)}</span>
            </div>
            <div className="flex items-center justify-between bg-[#f1f4ef] px-4 py-3 text-[13px] font-bold text-[#25412f]">
              <span>Peso bruto</span><span className="tabular">{formatKg(gross)}</span>
            </div>
          </div>
        </div>

        {document.transporterName && (
          <p className="mt-8 text-[11px] leading-5 text-[#5f645d]">
            Transporte: {document.transporterName}
            {document.transporterVehicle ? ` · ${document.transporterVehicle}` : ''}
            {document.transporterPlate ? ` · ${document.transporterPlate}` : ''}
          </p>
        )}

        {document.notes && (
          <div className="mt-6 border border-[#dfe1da] bg-[#fafaf7] px-4 py-3">
            <p className="label">Observaciones</p>
            <p className="mt-1 text-[11px] leading-5 text-[#4f554e]">{document.notes}</p>
          </div>
        )}

        <SignatureRow left="Embaló" right="Verificó" />

        <DocumentNotice title="Uso operativo">
          Lista de empaque homogénea armada con el peso neto de la operación y el envase declarado.
          La tara es estimada por bulto para el cálculo de peso bruto.
        </DocumentNotice>
      </div>

      <DocumentFooter label="Lista de empaque · Documento de demostración" />
    </DocumentArticle>
  );
}
