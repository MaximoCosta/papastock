import { Plus, SearchCheck, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatKg } from '../../lib/formatters';
import type { Lot, StockView, Transporter } from '../../types/domain';
import type { ExportLotLine } from '../../types/export';
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
  exportLines,
  lots,
  lotsMissingTreatment,
  stockViews,
  destinationCountry,
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
  onExportLinesChange,
  onCountryChange,
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
  exportLines: ExportLotLine[];
  lots: Lot[];
  lotsMissingTreatment: string[];
  stockViews: StockView[];
  destinationCountry: string;
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
  onExportLinesChange: (lines: ExportLotLine[]) => void;
  onCountryChange: (value: string) => void;
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
  const usedLotIds = new Set(exportLines.map((line) => line.lotId));
  const totalQuantity = exportLines.reduce((total, line) => total + line.quantity, 0);
  const stockByLotId = new Map(stockViews.map((record) => [record.lotId, record]));

  function updateLine(index: number, change: Partial<ExportLotLine>) {
    onExportLinesChange(exportLines.map((line, lineIndex) => lineIndex === index ? { ...line, ...change } : line));
  }

  function addLot() {
    const nextLot = lots.find((lot) => !usedLotIds.has(lot.id));
    if (!nextLot) return;
    const verified = stockByLotId.get(nextLot.id)?.verifiedQuantity ?? 0;
    onExportLinesChange([...exportLines, { lotId: nextLot.id, quantity: verified > 0 ? verified : 0 }]);
  }

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
        <FieldGroup step="01" title="Operación" description="Indicá uno o más lotes y el peso neto de cada uno.">
          <div className="space-y-3">
            {exportLines.map((line, index) => {
              const stock = stockByLotId.get(line.lotId);
              return (
              <div key={`${line.lotId}-${index}`} className="grid grid-cols-[minmax(0,1.4fr)_minmax(150px,0.6fr)_auto] items-end gap-3 max-[680px]:grid-cols-1">
                <label>
                  <span className="label">Lote {index + 1}</span>
                  <select className="field" value={line.lotId} onChange={(event) => updateLine(index, { lotId: event.target.value })}>
                    {lots.filter((lot) => lot.id === line.lotId || !usedLotIds.has(lot.id)).map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.code} · {lot.variety}{missing.has(lot.id) ? ' · falta tratamiento' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">Peso neto</span>
                  <span className="relative block">
                    <input className="field tabular pr-10" type="number" min="1" step="500" value={line.quantity || ''} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#747970]">kg</span>
                  </span>
                  {stock && (
                    <span className="mt-1 block text-[10px] text-[#7b8078]">
                      {formatKg(stock.verifiedQuantity)} verificados
                    </span>
                  )}
                </label>
                <Button variant="secondary" className="h-10 px-3" onClick={() => onExportLinesChange(exportLines.filter((_, lineIndex) => lineIndex !== index))} disabled={exportLines.length === 1} aria-label={`Quitar lote ${index + 1}`}>
                  <Trash2 size={15} />
                </Button>
              </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8ebe4] pt-3">
            <Button variant="secondary" onClick={addLot} disabled={usedLotIds.size >= lots.length}>
              <Plus size={15} /> Agregar lote
            </Button>
            <span className="text-[11px] font-semibold text-[#4e5b50]">Total: {new Intl.NumberFormat('es-AR').format(totalQuantity)} kg</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 max-[1080px]:grid-cols-2">
            <label>
              <span className="label">Destino</span>
              <select className="field" value={destinationCountry} onChange={(event) => onCountryChange(event.target.value)}>
                <option value="Brasil">Brasil</option>
                <option value="Chile">Chile</option>
                <option value="Uruguay">Uruguay</option>
              </select>
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
          <Button onClick={onAnalyze} disabled={isLoading || exportLines.length === 0 || exportLines.some((line) => !line.lotId || line.quantity <= 0) || !transporterId} className="min-w-[190px]">
            {isLoading ? <LoadingLabel>Analizando documentación...</LoadingLabel> : <><SearchCheck size={15} /> Analizar documentación</>}
          </Button>
        </div>
      </div>
    </section>
  );
}
