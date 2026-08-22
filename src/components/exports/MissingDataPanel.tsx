import { AlertTriangle, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { aiService } from '../../services/aiService';
import type { ParsedTraceabilityEvent } from '../../types/export';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LoadingLabel } from '../common/LoadingLabel';

export function MissingDataPanel({ onConfirm }: { onConfirm: (parsed: ParsedTraceabilityEvent) => void }) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTraceabilityEvent>();
  const [isLoading, setIsLoading] = useState(false);

  async function interpret() {
    if (!input.trim()) return;
    setIsLoading(true);
    const result = await aiService.parseTraceabilityInput(input);
    setParsed(result);
    setIsLoading(false);
  }

  return (
    <section className="border border-[#e0b8b3] bg-white">
      <div className="flex items-center gap-3 border-b border-[#ecd1ce] bg-[#fff8f7] px-5 py-3.5">
        <AlertTriangle size={17} className="text-[#a54139]" />
        <div>
          <h2 className="text-[13px] font-semibold text-[#49312f]">Información faltante</h2>
          <p className="mt-0.5 text-[10px] text-[#8a6864]">Tratamiento fitosanitario</p>
        </div>
      </div>
      <div className="p-5">
        <label htmlFor="traceability-input" className="label">Describí el dato faltante</label>
        <textarea
          id="traceability-input"
          className="field min-h-[96px] resize-y text-[12px] leading-5"
          placeholder="Ej.: El lote fue tratado con Producto X el 18 de agosto."
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (parsed) setParsed(undefined);
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="max-w-md text-[10px] leading-4 text-[#7a7f77]">El servicio interpreta texto libre. La validación de requisitos sigue siendo determinística.</p>
          <Button variant="secondary" disabled={!input.trim() || isLoading} onClick={interpret}>
            {isLoading ? <LoadingLabel>Interpretando información...</LoadingLabel> : <><Wand2 size={14} /> Interpretar información</>}
          </Button>
        </div>
        {parsed && (
          <ConfirmDialog
            parsed={parsed}
            onCancel={() => setParsed(undefined)}
            onConfirm={() => onConfirm(parsed)}
          />
        )}
      </div>
    </section>
  );
}
