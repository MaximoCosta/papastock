import { ClipboardCheck, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { formatKg, formatSignedKg } from '../../lib/formatters';
import { buildStockVerificationPreview } from '../../lib/stockVerification';
import { confirmStockVerification } from '../../services/stockVerificationService';
import type { StockVerificationConfirmation, StockView } from '../../types/domain';
import { Button } from '../common/Button';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StockVerificationForm({
  records,
  initialRecordId,
  onClose,
  onVerified,
}: {
  records: StockView[];
  initialRecordId?: string;
  onClose: () => void;
  onVerified: (confirmation: StockVerificationConfirmation) => Promise<void>;
}) {
  const selectable = useMemo(
    () => [...records].sort((a, b) => a.lot.code.localeCompare(b.lot.code, 'es') || a.location.name.localeCompare(b.location.name, 'es')),
    [records],
  );
  const defaultId = initialRecordId && selectable.some((item) => item.id === initialRecordId)
    ? initialRecordId
    : selectable.find((item) => item.verificationPending)?.id ?? selectable[0]?.id ?? '';

  const [stockRecordId, setStockRecordId] = useState(defaultId);
  const selected = selectable.find((item) => item.id === stockRecordId);
  const [countedQuantity, setCountedQuantity] = useState(String(selected?.declaredQuantity ?? ''));
  const [date, setDate] = useState(todayIso());
  const [bags, setBags] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const [previewed, setPreviewed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const preview = useMemo(() => buildStockVerificationPreview({
    stockRecordId,
    countedQuantity: Number(countedQuantity.replace(',', '.')),
    date,
    bags: bags.trim() ? Number(bags.replace(',', '.')) : undefined,
    notes: notes.trim() || undefined,
  }, selectable), [bags, countedQuantity, date, notes, selectable, stockRecordId]);

  function selectRecord(id: string) {
    const next = selectable.find((item) => item.id === id);
    setStockRecordId(id);
    setCountedQuantity(String(next?.declaredQuantity ?? ''));
    setPreviewed(false);
    setError(undefined);
  }

  function validate(event: FormEvent) {
    event.preventDefault();
    setPreviewed(true);
    setError(preview.valid ? undefined : preview.issues[0]?.message);
  }

  async function confirm() {
    if (!preview.valid || !selected) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await onVerified(await confirmStockVerification({
        stockRecordId: preview.stockRecordId,
        countedQuantity: preview.countedQuantity,
        date: preview.date,
        bags: preview.bags,
        notes: preview.notes,
      }, {
        lotId: selected.lotId,
        lotCode: selected.lot.code,
        locationId: selected.locationId,
        previousVerified: selected.verifiedQuantity,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo verificar el stock.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mb-4 border border-[#d8dad3] bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e746b]">Control físico</p>
          <h2 className="mt-1 text-[15px] font-semibold text-[#20231f]">Verificar stock</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#6b7068]">
            Registrá el conteo de piso sobre un lote y ubicación existentes. El declarado no cambia; se actualiza el verificado.
          </p>
        </div>
        <Button variant="ghost" onClick={onClose} type="button"><X size={14} /> Cerrar</Button>
      </div>

      <form onSubmit={validate} className="space-y-4">
        <fieldset className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Registro</legend>
          <Field label="Lote y ubicación" required>
            <select className="field mt-1 min-h-10 text-[12px]" value={stockRecordId} onChange={(event) => selectRecord(event.target.value)} required>
              {selectable.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.lot.code} · {record.lot.variety} · {record.location.name}
                  {record.verificationPending ? ' · pendiente' : record.status === 'discrepancy' ? ' · discrepancia' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de conteo" required>
            <input className="field mt-1 min-h-10 text-[12px]" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPreviewed(false); }} required />
          </Field>
        </fieldset>

        {selected && (
          <div className="grid grid-cols-4 divide-x divide-[#e2e4de] border border-[#e2e4de] bg-[#fafaf7] max-[900px]:grid-cols-2 max-[900px]:divide-x-0">
            <ReadonlyStat label="Declarado" value={formatKg(selected.declaredQuantity)} />
            <ReadonlyStat label="Verificado actual" value={selected.verificationPending ? 'Pendiente' : formatKg(selected.verifiedQuantity)} />
            <ReadonlyStat label="Campaña" value={selected.lot.campaign || '—'} />
            <ReadonlyStat label="Última actualización" value={selected.updatedAt.slice(0, 10)} />
          </div>
        )}

        <fieldset className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Conteo</legend>
          <Field label="Kilos contados" required>
            <input className="field mt-1 min-h-10 text-[12px]" inputMode="decimal" value={countedQuantity} onChange={(event) => { setCountedQuantity(event.target.value); setPreviewed(false); }} required />
          </Field>
          <Field label="Bolsas">
            <input className="field mt-1 min-h-10 text-[12px]" inputMode="numeric" value={bags} onChange={(event) => { setBags(event.target.value); setPreviewed(false); }} placeholder="705" />
          </Field>
          <label className="col-span-2 max-[1100px]:col-span-2">
            <span className="label">Observaciones</span>
            <input className="field mt-1 min-h-10 text-[12px]" value={notes} onChange={(event) => { setNotes(event.target.value); setPreviewed(false); }} placeholder="Conteo en cámara 2, bolsa blanca" />
          </label>
        </fieldset>

        {error && (
          <p className="border border-[#e4b9b4] bg-[#fdf0ee] px-3 py-2 text-[12px] text-[#943a34]">{error}</p>
        )}

        {previewed && preview.valid && (
          <div className={`border p-3 text-[12px] ${preview.difference === 0 ? 'border-[#bfd0c2] bg-[#f4f8f4] text-[#2e3931]' : 'border-[#e4c9a4] bg-[#fff8ee] text-[#5c4630]'}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em]">Resultado del conteo</p>
            <p className="mt-1 font-semibold">{preview.lotCode} · {preview.locationName} · {formatKg(preview.countedQuantity)}</p>
            <p className="mt-0.5">
              Declarado {formatKg(preview.declaredQuantity)} · diferencia {formatSignedKg(preview.difference)}
              {preview.difference === 0 ? ' · queda conciliado' : ' · queda como discrepancia hasta resolverla'}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[#e7e8e3] pt-3">
          <Button type="submit" variant="secondary" disabled={isSaving}>
            <ClipboardCheck size={14} /> Validar conteo
          </Button>
          <Button type="button" onClick={() => void confirm()} disabled={!previewed || !preview.valid || isSaving}>
            <ShieldCheck size={14} /> {isSaving ? 'Guardando…' : 'Confirmar verificación'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label>
      <span className="label">{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  );
}

function ReadonlyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="label">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-[#2a312c]">{value}</p>
    </div>
  );
}
