import { SearchCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Lot, Transporter } from '../../types/domain';
import { Button } from '../common/Button';
import { LoadingLabel } from '../common/LoadingLabel';
import { TransporterProfileCard } from '../transporters/TransporterProfileCard';

function FieldGroup({ step, title, description, children }: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-t border-[#e8ebe4] pt-4 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#4f5a51]">{title}</h3>
          <p className="mt-0.5 text-[10px] text-[#7b8078]">{description}</p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9aa098]">{step}</span>
      </div>
      {children}
    </fieldset>
  );
}

export function ExportForm({
  lotId,
  lots,
  lotsMissingTreatment,
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
  requirementsSourceText,
  useAiRequirements,
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
  onRequirementsSourceTextChange,
  onUseAiRequirementsChange,
  onAnalyze,
}: {
  lotId: string;
  lots: Lot[];
  lotsMissingTreatment: string[];
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
  requirementsSourceText: string;
  useAiRequirements: boolean;
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
  onRequirementsSourceTextChange: (value: string) => void;
  onUseAiRequirementsChange: (value: boolean) => void;
  onAnalyze: () => void;
}) {
  const selectedTransporter = transporters.find((item) => item.id === transporterId);
  const activeTransporters = transporters.filter((item) => item.active);
  const missing = new Set(lotsMissingTreatment);

  return (
    <section className="border border-[#d6d9d1] bg-white">
      <div className="flex items-center justify-between border-b border-[#e0e2dc] px-5 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-[#2a2f2a]">Datos de la operación</h2>
          <p className="mt-0.5 text-[10px] text-[#7b8078]">Operación, logística y base documental para la validación.</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Paso 01</span>
      </div>

      <div className="space-y-5 p-5">
        <FieldGroup step="01" title="Operación" description="Qué se exporta, a dónde y en qué condición comercial.">
          <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2">
            <label>
              <span className="label">Lote</span>
              <select className="field" value={lotId} onChange={(event) => onLotChange(event.target.value)}>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.code} · {lot.variety}{missing.has(lot.id) ? ' · falta tratamiento' : ''}
                  </option>
                ))}
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
        </FieldGroup>

        <FieldGroup step="02" title="Logística" description="Comprador, puertos, fecha de despacho y transportista.">
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

          <div className="mt-4 grid grid-cols-[1fr_1.2fr] gap-4 max-[900px]:grid-cols-1">
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
        </FieldGroup>

        <FieldGroup
          step="03"
          title="Documentación"
          description="Origen de los requisitos a verificar contra los datos del lote."
        >
          <label className="flex cursor-pointer items-start gap-2.5 border border-[#dfe2db] bg-[#fafaf7] px-4 py-3">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={useAiRequirements}
              onChange={(event) => onUseAiRequirementsChange(event.target.checked)}
            />
            <span>
              <span className="block text-[11px] font-semibold text-[#30352f]">Derivar requisitos del texto documental</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-[#7b8078]">
                Sin marcar se usa el listado de demo. Marcado, el texto se interpreta y se
                convierte en requisitos verificables; la validación sigue siendo determinística.
              </span>
            </span>
          </label>

          {useAiRequirements && (
            <label className="mt-3 block">
              <span className="label">Texto documental del destino</span>
              <textarea
                className="field min-h-20 text-[12px] leading-5"
                value={requirementsSourceText}
                onChange={(event) => onRequirementsSourceTextChange(event.target.value)}
                placeholder="Ej.: La documentación debe contener número de lote, variedad, origen, peso neto y tratamiento fitosanitario."
              />
            </label>
          )}
        </FieldGroup>

        <div className="flex justify-end border-t border-[#e8ebe4] pt-4">
          <Button onClick={onAnalyze} disabled={isLoading || !lotId || quantity <= 0 || !transporterId} className="min-w-[190px]">
            {isLoading ? <LoadingLabel>Analizando documentación...</LoadingLabel> : <><SearchCheck size={15} /> Analizar documentación</>}
          </Button>
        </div>
      </div>
    </section>
  );
}
