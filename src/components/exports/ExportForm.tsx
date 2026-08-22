import { SearchCheck } from 'lucide-react';
import { lots } from '../../data/lots';
import { Button } from '../common/Button';
import { LoadingLabel } from '../common/LoadingLabel';

export function ExportForm({
  lotId,
  destinationCountry,
  quantity,
  isLoading,
  onLotChange,
  onCountryChange,
  onQuantityChange,
  onAnalyze,
}: {
  lotId: string;
  destinationCountry: string;
  quantity: number;
  isLoading: boolean;
  onLotChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="border border-[#d6d9d1] bg-white">
      <div className="flex items-center justify-between border-b border-[#e0e2dc] px-5 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-[#2a2f2a]">Datos de la operación</h2>
          <p className="mt-0.5 text-[10px] text-[#7b8078]">Seleccioná lote, destino y cantidad a preparar.</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Paso 01</span>
      </div>
      <div className="grid grid-cols-[1fr_1fr_0.8fr_auto] items-end gap-4 p-5 max-[1080px]:grid-cols-2">
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
        <Button onClick={onAnalyze} disabled={isLoading || !lotId || quantity <= 0} className="min-w-[190px] max-[1080px]:w-full">
          {isLoading ? <LoadingLabel>Analizando documentación...</LoadingLabel> : <><SearchCheck size={15} /> Analizar documentación</>}
        </Button>
      </div>
    </section>
  );
}

