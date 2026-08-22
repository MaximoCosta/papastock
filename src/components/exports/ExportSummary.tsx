import { ArrowRight, CheckCircle2, FileOutput, Receipt, Truck } from 'lucide-react';
import { useState } from 'react';
import { formatKg } from '../../lib/formatters';
import type { Transporter } from '../../types/domain';
import type { ExportDocumentItem } from '../../types/export';
import { Button } from '../common/Button';
import { TransporterProfileCard } from '../transporters/TransporterProfileCard';

export function ExportSummary({
  items,
  totalQuantity,
  destination,
  buyerName,
  incoterm,
  departurePort,
  arrivalPort,
  departureDate,
  transporter,
  onGenerateProforma,
  onGenerateFactura,
  onGenerateRemito,
}: {
  items: ExportDocumentItem[];
  totalQuantity: number;
  destination: string;
  buyerName: string;
  incoterm: string;
  departurePort: string;
  arrivalPort: string;
  departureDate: string;
  transporter?: Transporter;
  onGenerateProforma: () => void;
  onGenerateFactura: (unitPrice: number, currency: string) => void;
  onGenerateRemito: () => void;
}) {
  const [unitPrice, setUnitPrice] = useState(0.35);
  const currency = 'USD';

  return (
    <section className="space-y-3">
      <div className="border border-[#b8cfbd] bg-[#f2f7f3]">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#b9d0bf] bg-white text-[#315d42]">
            <CheckCircle2 size={18} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#53715c]">Documentación lista</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[#25412f]">Todos los requisitos fueron encontrados</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#617267]">
              La trazabilidad de cada lote y el perfil del transportista respaldan la emisión documental.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#405247]">
              <span>{items.length === 1 ? items[0].lotCode : `${items.length} lotes`}</span>
              <ArrowRight size={13} />
              <span>{destination}</span>
              <span className="mx-1 text-[#b1bcb4]">·</span>
              <span>{formatKg(totalQuantity)}</span>
              <span className="mx-1 text-[#b1bcb4]">·</span>
              <span>{incoterm}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#c7dacc]">
          <div className="grid grid-cols-[1fr_1.2fr_auto] gap-4 bg-[#e9f1eb] px-5 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-[#5f7266]">
            <span>Lote</span><span>Variedad</span><span className="text-right">Peso neto</span>
          </div>
          {items.map((item) => (
            <div key={item.lotId} className="grid grid-cols-[1fr_1.2fr_auto] gap-4 border-t border-[#d9e6dd] px-5 py-2.5 text-[11px] text-[#333832]">
              <span className="font-semibold">{item.lotCode}</span>
              <span>{item.variety}</span>
              <span className="tabular text-right font-semibold">{formatKg(item.quantity)}</span>
            </div>
          ))}
          {items.length > 1 && (
            <div className="grid grid-cols-[1fr_1.2fr_auto] gap-4 border-t border-[#c7dacc] px-5 py-2.5 text-[11px] font-bold text-[#25412f]">
              <span className="col-span-2">Total</span>
              <span className="tabular text-right">{formatKg(totalQuantity)}</span>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#c7dacc] px-5 py-4 text-[11px]">
          <div><dt className="label">Comprador</dt><dd className="mt-0.5 font-semibold text-[#333832]">{buyerName || '—'}</dd></div>
          <div><dt className="label">Despacho</dt><dd className="mt-0.5 font-semibold tabular text-[#333832]">{departureDate || '—'}</dd></div>
          <div><dt className="label">Salida</dt><dd className="mt-0.5 text-[#333832]">{departurePort || '—'}</dd></div>
          <div><dt className="label">Llegada</dt><dd className="mt-0.5 text-[#333832]">{arrivalPort || '—'}</dd></div>
        </dl>

        <div className="flex flex-wrap items-end gap-3 border-t border-[#c7dacc] px-5 py-4">
          <Button onClick={onGenerateProforma}><FileOutput size={15} /> Generar proforma</Button>
          <label>
            <span className="label">Precio unit. (USD/kg)</span>
            <input
              className="field tabular w-[140px]"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice || ''}
              onChange={(event) => setUnitPrice(Number(event.target.value))}
            />
          </label>
          <Button variant="secondary" onClick={() => onGenerateFactura(unitPrice, currency)} disabled={unitPrice <= 0}>
            <Receipt size={15} /> Generar factura
          </Button>
          <Button variant="secondary" onClick={onGenerateRemito} disabled={!transporter}>
            <Truck size={15} /> Generar remito
          </Button>
        </div>
      </div>

      {transporter && <TransporterProfileCard transporter={transporter} compact />}
    </section>
  );
}
