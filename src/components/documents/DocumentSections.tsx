import type { ReactNode } from 'react';
import { formatDate, formatKg } from '../../lib/formatters';
import type { DocumentCommercialFields, ExportDocumentItem } from '../../types/export';

export function PartyBlock({
  title,
  name,
  lines,
}: {
  title: string;
  name: string;
  lines: Array<string | undefined>;
}) {
  const visible = lines.filter((line): line is string => Boolean(line));
  return (
    <div>
      <p className="label">{title}</p>
      <p className="text-[14px] font-semibold">{name}</p>
      {visible.length > 0 && (
        <p className="mt-1 text-[11px] leading-5 text-[#737970]">
          {visible.map((line, index) => (
            <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>
          ))}
        </p>
      )}
    </div>
  );
}

export function DocumentItemsTable({
  items,
  showPrice = false,
  currency = 'USD',
  formatMoney,
}: {
  items: ExportDocumentItem[];
  showPrice?: boolean;
  currency?: string;
  formatMoney?: (value: number, currency?: string) => string;
}) {
  const columns = showPrice
    ? 'grid-cols-[0.9fr_1.1fr_0.8fr_0.8fr_0.8fr_0.9fr]'
    : 'grid-cols-[0.9fr_1.1fr_1fr_0.9fr_0.9fr]';

  return (
    <div className="border-y border-[#cfd2ca]">
      <div className={`grid ${columns} border-b border-[#dfe1da] bg-[#f6f7f3] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#70766e]`}>
        <span>Lote</span>
        <span>Variedad</span>
        <span>Origen</span>
        <span className="text-right">Peso neto</span>
        {showPrice ? (
          <>
            <span className="text-right">Precio / kg</span>
            <span className="text-right">Importe</span>
          </>
        ) : (
          <span>Tratamiento</span>
        )}
      </div>
      {items.map((item) => (
        <div key={item.lotId || item.lotCode} className={`grid ${columns} border-b border-[#eceee8] px-4 py-4 text-[12px] font-semibold text-[#2d332e] last:border-b-0`}>
          <span>{item.lotCode}</span>
          <span>{item.variety}<span className="mt-0.5 block text-[10px] font-medium text-[#7a8078]">{item.campaign}</span></span>
          <span className="text-[11px] font-medium leading-4">{item.origin}</span>
          <span className="tabular text-right">{formatKg(item.quantity)}</span>
          {showPrice && formatMoney ? (
            <>
              <span className="tabular text-right">{formatMoney(item.unitPrice ?? 0, currency)}</span>
              <span className="tabular text-right">{formatMoney(item.lineTotal ?? 0, currency)}</span>
            </>
          ) : (
            <span className="text-[11px] font-medium">{item.treatment || '—'}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function PackingFacts({ document }: { document: DocumentCommercialFields }) {
  const facts: Array<[string, ReactNode]> = [
    ['Envase', document.packaging ? `${document.packaging}${document.bagWeightKg ? ` · ${document.bagWeightKg} kg` : ''}` : undefined],
    ['Bultos', document.bagCount !== undefined ? `${document.bagCount}${document.packingHomogeneous === false ? ' (último bulto con remanente)' : ''}` : undefined],
    ['Calibre', document.caliber],
    ['Categoría', document.category],
    ['NCM / HS', document.hsCode],
    ['Marcas', document.shippingMarks],
    ['Peso neto', document.netWeightKg !== undefined ? formatKg(document.netWeightKg) : undefined],
    ['Peso bruto', document.grossWeightKg !== undefined ? formatKg(document.grossWeightKg) : undefined],
  ];
  const visible = facts.filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (visible.length === 0) return null;

  return (
    <dl className="mt-8 grid grid-cols-4 gap-x-6 gap-y-5 max-[820px]:grid-cols-2">
      {visible.map(([label, value]) => (
        <div key={label}>
          <dt className="label">{label}</dt>
          <dd className="mt-0.5 text-[12px] leading-5 text-[#333832]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TraceabilityFacts({
  origin,
  producer,
  harvestDate,
  treatment,
  qualityResult,
}: {
  origin?: string;
  producer?: string;
  harvestDate?: string;
  treatment?: string;
  qualityResult?: string;
}) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-12 gap-y-6">
      {origin && (
        <div className="border-l-2 border-[#dbb488] pl-3">
          <dt className="label text-[#96552b]!">Origen</dt>
          <dd className="text-[12px] leading-5 text-[#333832]">{origin}</dd>
        </div>
      )}
      {producer && (
        <div>
          <dt className="label">Productor</dt>
          <dd className="text-[12px] leading-5 text-[#333832]">{producer}</dd>
        </div>
      )}
      {harvestDate && (
        <div>
          <dt className="label">Cosecha</dt>
          <dd className="text-[12px] leading-5 text-[#333832]">{formatDate(harvestDate)}</dd>
        </div>
      )}
      {treatment && (
        <div>
          <dt className="label">Tratamiento fitosanitario</dt>
          <dd className="text-[12px] leading-5 text-[#333832]">{treatment}</dd>
        </div>
      )}
      {qualityResult && (
        <div>
          <dt className="label">Control de calidad</dt>
          <dd className="text-[12px] leading-5 text-[#333832]">{qualityResult}</dd>
        </div>
      )}
    </dl>
  );
}

export function CommercialTerms({
  incoterm,
  paymentTerms,
  validUntil,
  departurePort,
  arrivalPort,
  departureDate,
  notes,
}: {
  incoterm?: string;
  paymentTerms?: string;
  validUntil?: string;
  departurePort?: string;
  arrivalPort?: string;
  departureDate?: string;
  notes?: string;
}) {
  const rows: Array<[string, string | undefined]> = [
    ['Incoterm', incoterm],
    ['Condición de pago', paymentTerms],
    ['Vigencia de oferta', validUntil ? formatDate(validUntil) : undefined],
    ['Puerto de salida', departurePort],
    ['Puerto de llegada', arrivalPort],
    ['Fecha de despacho', departureDate ? formatDate(departureDate) : undefined],
  ];
  const visible = rows.filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="mt-8">
      <dl className="grid grid-cols-3 gap-x-8 gap-y-5 max-[820px]:grid-cols-2">
        {visible.map(([label, value]) => (
          <div key={label}>
            <dt className="label">{label}</dt>
            <dd className="mt-0.5 text-[12px] leading-5 text-[#333832]">{value}</dd>
          </div>
        ))}
      </dl>
      {notes && (
        <div className="mt-6 border border-[#dfe1da] bg-[#fafaf7] px-4 py-3">
          <p className="label">Observaciones</p>
          <p className="mt-1 text-[11px] leading-5 text-[#4f554e]">{notes}</p>
        </div>
      )}
    </div>
  );
}

export function SignatureRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="mt-16 grid grid-cols-2 gap-12">
      <div className="border-t border-[#c6cac0] pt-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">{left}</p>
        <p className="mt-1 text-[10px] text-[#9a9e96]">Firma y aclaración</p>
      </div>
      <div className="border-t border-[#c6cac0] pt-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">{right}</p>
        <p className="mt-1 text-[10px] text-[#9a9e96]">Firma y aclaración</p>
      </div>
    </div>
  );
}

export function DocumentNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-12 border-l-[3px] border-[#607c67] bg-[#f1f4ef] px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#657068]">{title}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-[#5f665f]">{children}</p>
    </div>
  );
}

export function fallbackItems(document: {
  lotCode: string;
  variety: string;
  campaign: string;
  origin?: string;
  quantity: number;
  treatment?: string;
  items?: ExportDocumentItem[];
}): ExportDocumentItem[] {
  if (document.items?.length) return document.items;
  return [{
    lotId: document.lotCode,
    lotCode: document.lotCode,
    variety: document.variety,
    campaign: document.campaign,
    origin: document.origin ?? '—',
    quantity: document.quantity,
    treatment: document.treatment,
  }];
}
