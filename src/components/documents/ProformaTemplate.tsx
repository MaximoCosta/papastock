import { formatDate, formatKg, formatMoney } from '../../lib/formatters';
import type { ProformaDocument } from '../../types/export';
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

export function ProformaTemplate({ document }: { document: ProformaDocument }) {
  const items = fallbackItems(document);
  const currency = document.currency || 'USD';
  const unitPrice = document.unitPrice ?? 0;
  const total = items.reduce((sum, item) => sum + (item.lineTotal ?? item.quantity * unitPrice), 0);

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Proforma invoice" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-9 grid grid-cols-2 gap-12">
          <PartyBlock
            title="Exportador"
            name={document.exporter}
            lines={[
              document.exporterAddress,
              document.exporterCity || 'Balcarce, Buenos Aires',
              document.exporterTaxId ? `CUIT ${document.exporterTaxId}` : undefined,
              document.exporterSenasa,
              document.exporterPhone,
            ]}
          />
          <PartyBlock
            title="Comprador / consignatario"
            name={document.buyerName || document.destinationCountry}
            lines={[
              document.buyerAddress,
              document.buyerCity,
              document.destinationCountry,
              document.buyerTaxId,
              document.arrivalPort ? `Destino: ${document.arrivalPort}` : undefined,
            ]}
          />
        </div>

        <DocumentItemsTable items={items} showPrice={unitPrice > 0} currency={currency} formatMoney={formatMoney} />

        {unitPrice > 0 && (
          <div className="mt-6 flex justify-end">
            <div className="w-[280px] border border-[#cfd2ca]">
              <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
                <span>Peso neto</span><span className="tabular font-semibold">{formatKg(document.quantity)}</span>
              </div>
              <div className="flex items-center justify-between bg-[#f1f4ef] px-4 py-3 text-[13px] font-bold text-[#25412f]">
                <span>Total proforma</span><span className="tabular">{formatMoney(total, currency)}</span>
              </div>
            </div>
          </div>
        )}

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
          validUntil={document.validUntil}
          departurePort={document.departurePort}
          arrivalPort={document.arrivalPort}
          departureDate={document.departureDate}
          notes={document.notes}
        />

        {document.transporterName && (
          <dl className="mt-8 grid grid-cols-2 gap-x-12 gap-y-4">
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
          </dl>
        )}

        <SignatureRow left="Exportador" right="Aceptación del comprador" />

        <DocumentNotice title="Documento no fiscal">
          Proforma armada el {formatDate(document.createdAt)} con la trazabilidad registrada
          {items.length === 1 ? ` del lote ${document.lotCode}` : ` de ${items.length} lotes`} y el perfil del transportista.
          No constituye factura ni compromiso de embarque.
        </DocumentNotice>
      </div>

      <DocumentFooter />
    </DocumentArticle>
  );
}
