import { SearchCheck } from 'lucide-react';
import type { Lot, Transporter } from '../../types/domain';
import { Button } from '../common/Button';
import { LoadingLabel } from '../common/LoadingLabel';
import { TransporterProfileCard } from '../transporters/TransporterProfileCard';

export function ExportForm({
  lotId,
  lots,
  destinationCountry,
  quantity,
  buyerName,
  incoterm,
  departurePort,
  arrivalPort,
  departureDate,
  transporterId,
  transporters,
  notes,
  isLoading,
  onLotChange,
  onCountryChange,
  onQuantityChange,
  onBuyerChange,
  onIncotermChange,
  onDeparturePortChange,
  onArrivalPortChange,
  onDepartureDateChange,
  onTransporterChange,
  onNotesChange,
  onAnalyze,
}: {
  lotId: string;
  lots: Lot[];
  destinationCountry: string;
  quantity: number;
  buyerName: string;
  incoterm: string;
  departurePort: string;
  arrivalPort: string;
  departureDate: string;
  transporterId: string;
  transporters: Transporter[];
  notes: string;
  isLoading: boolean;
  onLotChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onBuyerChange: (value: string) => void;
  onIncotermChange: (value: string) => void;
  onDeparturePortChange: (value: string) => void;
  onArrivalPortChange: (value: string) => void;
  onDepartureDateChange: (value: string) => void;
  onTransporterChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  const selectedTransporter = transporters.find((item) => item.id === transporterId);
  const activeTransporters = transporters.filter((item) => item.active);

  return (
    <section className="border border-[#d6d9d1] bg-white">
      <div className="flex items-center justify-between border-b border-[#e0e2dc] px-5 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-[#2a2f2a]">Datos de la operación</h2>
          <p className="mt-0.5 text-[10px] text-[#7b8078]">Lote, destino, logística y transportista para la documentación.</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Paso 01</span>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2">
          <label>
            <span className="label">Lote</span>
            <select className="field" value={lotId} onChange={(event) => onLotChange(event.target.value)}>
              {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.code} · {lot.variety}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Destino</span>
            <select className="field" value={destinationCountry} onChange={(event) => onCountryChange(event.target.value)}>
              <option value="Brasil">Brasil</option>
              <option value="Chile">Chile</option>
              <option value="Uruguay">Uruguay</option>
            </select>
          </label>
          <label>
            <span className="label">Cantidad</span>
            <span className="relative block">
              <input
                className="field tabular pr-10"
                type="number"
                min="1"
                step="500"
                value={quantity || ''}
                onChange={(event) => onQuantityChange(Number(event.target.value))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#747970]">kg</span>
            </span>
          </label>
          <label>
            <span className="label">Incoterm</span>
            <select className="field" value={incoterm} onChange={(event) => onIncotermChange(event.target.value)}>
              <option value="FOB">FOB</option>
              <option value="CIF">CIF</option>
              <option value="EXW">EXW</option>
              <option value="DAP">DAP</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2">
          <label>
            <span className="label">Comprador / consignatario</span>
            <input className="field" value={buyerName} onChange={(event) => onBuyerChange(event.target.value)} placeholder="Ej. Distribuidora Sul Ltda." />
          </label>
          <label>
            <span className="label">Puerto / punto de salida</span>
            <input className="field" value={departurePort} onChange={(event) => onDeparturePortChange(event.target.value)} placeholder="Ej. Bahía Blanca" />
          </label>
          <label>
            <span className="label">Puerto / punto de llegada</span>
            <input className="field" value={arrivalPort} onChange={(event) => onArrivalPortChange(event.target.value)} placeholder="Ej. Santos" />
          </label>
          <label>
            <span className="label">Fecha de despacho</span>
            <input className="field" type="date" value={departureDate} onChange={(event) => onDepartureDateChange(event.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-[1fr_1.2fr] gap-4 max-[900px]:grid-cols-1">
          <div>
            <label>
              <span className="label">Transportista</span>
              <select className="field" value={transporterId} onChange={(event) => onTransporterChange(event.target.value)}>
                <option value="">Seleccionar transportista…</option>
                {activeTransporters.map((transporter) => (
                  <option key={transporter.id} value={transporter.id}>
                    {transporter.tradeName || transporter.companyName} · {transporter.licensePlate}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="label">Notas operativas</span>
              <textarea
                className="field min-h-20"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Instrucciones de carga, temperatura, documentación adjunta…"
              />
            </label>
          </div>
          <div>
            {selectedTransporter ? (
              <TransporterProfileCard transporter={selectedTransporter} compact />
            ) : (
              <div className="flex h-full min-h-[120px] items-center justify-center border border-dashed border-[#cfd2ca] bg-[#fafaf7] px-4 text-center text-[11px] text-[#747970]">
                Seleccioná un transportista para ver su perfil completo (CUIT, patente, contacto y capacidad).
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-[#e8ebe4] pt-4">
          <Button onClick={onAnalyze} disabled={isLoading || !lotId || quantity <= 0 || !transporterId} className="min-w-[190px]">
            {isLoading ? <LoadingLabel>Analizando documentación...</LoadingLabel> : <><SearchCheck size={15} /> Analizar documentación</>}
          </Button>
        </div>
      </div>
    </section>
  );
}
