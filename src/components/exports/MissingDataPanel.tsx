import { AlertTriangle, ScanText } from 'lucide-react';
import { useState } from 'react';
import { aiService } from '../../services/aiService';
import type { ConfirmedTraceabilityEvent, ParsedTraceabilityEvent } from '../../types/export';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LoadingLabel } from '../common/LoadingLabel';

export function MissingDataPanel({
  lotId,
  lotCode,
  onConfirm,
}: {
  lotId: string;
  lotCode: string;
  onConfirm: (confirmed: ConfirmedTraceabilityEvent) => Promise<void>;
}) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTraceabilityEvent>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function interpret() {
    if (input.trim().length < 8) return;
    setIsLoading(true);
    setError(undefined);
    try {
      setParsed(await aiService.parseTraceabilityInput(input, lotId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo interpretar la información.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="border border-[#e0b8b3] bg-white">
      <div className="flex items-center gap-3 border-b border-[#ecd1ce] bg-[#fff8f7] px-5 py-3.5">
        <AlertTriangle size={17} className="text-[#a54139]" />
        <div>
          <h2 className="text-[13px] font-semibold text-[#49312f]">Información faltante</h2>
          <p className="mt-0.5 text-[10px] text-[#8a6864]">Tratamiento fitosanitario · lote {lotCode}</p>
        </div>
      </div>
      <div className="p-5">
        <label htmlFor="traceability-input" className="label">Describí el dato faltante</label>
        <textarea
          id="traceability-input"
          className="field min-h-[96px] resize-y text-[12px] leading-5"
          placeholder="Ej.: El lote fue tratado con Mancozeb el 18 de agosto de 2026."
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (parsed) setParsed(undefined);
            if (error) setError(undefined);
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="max-w-md text-[10px] leading-4 text-[#7a7f77]">
            La interpretación extrae producto y fecha. Nunca completa datos que no estén en el texto,
            y la validación de requisitos sigue siendo determinística.
          </p>
          <Button variant="secondary" disabled={input.trim().length < 8 || isLoading} onClick={interpret}>
            {isLoading ? <LoadingLabel>Interpretando información...</LoadingLabel> : <><ScanText size={14} /> Interpretar información</>}
          </Button>
        </div>

        {error && <p className="mt-3 text-[11px] font-semibold text-[#a23d36]" role="alert">{error}</p>}

        {parsed && (
          <ConfirmDialog
            parsed={parsed}
            onCancel={() => setParsed(undefined)}
            isSaving={isSaving}
            onConfirm={(confirmed) => {
              setIsSaving(true);
              void onConfirm(confirmed)
                .then(() => setParsed(undefined))
                .catch(() => undefined)
                .finally(() => setIsSaving(false));
            }}
          />
        )}
      </div>
    </section>
  );
}
