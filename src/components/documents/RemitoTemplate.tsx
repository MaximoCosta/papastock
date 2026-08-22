import { formatKg } from '../../lib/formatters';
import type { RemitoDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';
import {
  DocumentNotice,
  PackingFacts,
  PartyBlock,
  SignatureRow,
  fallbackItems,
} from './DocumentSections';

export function RemitoTemplate({ document }: { document: RemitoDocument }) {
  const items = fallbackItems({
    lotCode: document.lotCode,
    variety: document.variety,
    campaign: document.campaign ?? '—',
    origin: document.origin,
    quantity: document.quantity,
    items: document.items,
  });

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Remito" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-3 gap-8">
          <PartyBlock title="Origen" name={document.originLocation} lines={[document.origin]} />
          <PartyBlock title="Destino" name={document.destinationLocation} lines={[document.destinationCountry, document.buyerCity]} />
          <PartyBlock
            title="Transportista"
            name={document.transporter || 'No informado'}
            lines={[document.transporterCuit, document.transporterVehicle, document.transporterPlate]}
          />
        </div>

        {(document.transporterPlate || document.transporterContact) && (
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
          <div className="grid grid-cols-[0.9fr_1.1fr_0.9fr_0.8fr_0.8fr] border-b border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#70766e]">
            <span>Lote</span><span>Variedad</span><span>Referencia</span><span className="text-right">Bultos</span><span className="text-right">Cantidad</span>
          </div>
          {items.map((item) => (
            <div key={item.lotId || item.lotCode} className="grid grid-cols-[0.9fr_1.1fr_0.9fr_0.8fr_0.8fr] border-b border-[#eceee8] px-4 py-4 text-[13px] font-semibold text-[#2d332e] last:border-b-0">
              <span>{item.lotCode}</span>
              <span>{item.variety}</span>
              <span className="text-[11px] font-medium">{document.dispatchReference}</span>
              <span className="tabular text-right">{item.bagCount ?? document.bagCount ?? '—'}</span>
              <span className="tabular text-right">{formatKg(item.quantity)}</span>
            </div>
          ))}
        </div>

        <PackingFacts document={document} />

        {document.notes && (
          <div className="mt-6 border border-[#dfe1da] bg-[#fafaf7] px-4 py-3">
            <p className="label">Observaciones</p>
            <p className="mt-1 text-[11px] leading-5 text-[#4f554e]">{document.notes}</p>
          </div>
        )}

        <SignatureRow left="Despacha" right="Recibe conforme" />

        <DocumentNotice title="Origen de datos">
          Remito generado a partir del despacho validado
          {items.length === 1 ? ` del lote ${document.lotCode}` : ` de ${items.length} lotes`} y el perfil del transportista.
        </DocumentNotice>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
