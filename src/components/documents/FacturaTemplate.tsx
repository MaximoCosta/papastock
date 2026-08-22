import { formatDate, formatKg, formatMoney } from '../../lib/formatters';
import type { FacturaDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';
import {
  CommercialTerms,
  DocumentItemsTable,
  DocumentNotice,
  PackingFacts,
  PartyBlock,
  SignatureRow,
  TraceabilityFacts,
  fallbackItems,
} from './DocumentSections';

export function FacturaTemplate({ document }: { document: FacturaDocument }) {
  const items = fallbackItems({ ...document, origin: document.origin, treatment: document.treatment });
  const subtotal = items.reduce((sum, item) => sum + (item.lineTotal ?? item.quantity * document.unitPrice), 0);

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Factura comercial" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-2 gap-12">
          <PartyBlock
            title="Vendedor"
            name={document.exporter}
            lines={[
              document.exporterAddress,
              document.exporterCity || 'Balcarce, Buenos Aires',
              document.exporterTaxId ? `CUIT ${document.exporterTaxId}` : undefined,
              document.exporterSenasa,
            ]}
          />
          <PartyBlock
            title="Comprador"
            name={document.buyerName || document.destinationCountry}
            lines={[
              document.buyerAddress,
              document.buyerCity,
              document.destinationCountry,
              document.buyerTaxId,
              document.incoterm ? `Incoterm ${document.incoterm}` : undefined,
            ]}
          />
        </div>

        <DocumentItemsTable items={items} showPrice currency={document.currency} formatMoney={formatMoney} />

        <div className="mt-6 flex justify-end">
          <div className="w-[280px] border border-[#cfd2ca]">
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Campaña</span><span className="font-semibold">{document.campaign}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Peso neto</span><span className="tabular font-semibold">{formatKg(document.quantity)}</span>
            </div>
            <div className="flex items-center justify-between bg-[#f1f4ef] px-4 py-3 text-[13px] font-bold text-[#25412f]">
              <span>Total</span><span className="tabular">{formatMoney(subtotal, document.currency)}</span>
            </div>
          </div>
        </div>

        <PackingFacts document={document} />
        <TraceabilityFacts
          origin={document.origin}
          producer={document.producer}
          harvestDate={document.harvestDate}
          treatment={document.treatment}
          qualityResult={document.qualityResult}
        />
        <CommercialTerms
          incoterm={document.incoterm}
          paymentTerms={document.paymentTerms}
          departurePort={document.departurePort}
          arrivalPort={document.arrivalPort}
          departureDate={document.departureDate}
          notes={document.notes}
        />

        {document.transporterName && (
          <p className="mt-6 text-[11px] text-[#5f645d]">Transportista: {document.transporterName}</p>
        )}

        <SignatureRow left="Emisor" right="Receptor" />

        <DocumentNotice title="Aclaración">
          Comprobante generado el {formatDate(document.createdAt)} para la demostración del flujo operativo.
          No constituye un documento fiscal válido.
        </DocumentNotice>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
