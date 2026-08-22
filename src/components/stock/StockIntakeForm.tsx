import { PackagePlus, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { formatKg } from '../../lib/formatters';
import { confirmStockIntake, previewStockIntake } from '../../services/stockIntakeService';
import type { Location, PlanillaImportConfirmation, PlanillaImportPreview, StockIntakeInput } from '../../types/domain';
import { Button } from '../common/Button';

const VARIETIES = [
  'Agata', 'Spunta', 'Asterix', 'Atlantic', 'Daifla', 'King Russet', 'Ludmilla',
  'Memphis', 'Sunred', 'Quintera', 'Sagitta', 'Sababa', '7 Four 7', 'Sinatra', 'Edison', 'Yona',
];
const CALIBERS = ['exportacion', 'sin chicas', 'granel', 'recibo', 'desc.expo', 'expo buena'];
const CATEGORIES = ['inicial 1', 'inicial 2', 'inicial 3', 'solo chasis'];
const PLANILLA_DESTINATIONS = [
  'Dos Panca', 'Galpón Principal', 'Planta Santa Ana', 'Trevelin', 'Belmonte',
  'Cecive', 'Sasula Balcarce', 'Frigopap', 'Pancani',
];
const PLANILLA_ORIGINS = ['Campo', 'Campo Trevelin', 'Planta Santa Ana', 'Galpón Principal'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function optionalNumber(value: string): number | undefined {
  const parsed = Number(value.replace(',', '.'));
  return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const emptyForm = {
  lotCode: '',
  variety: '',
  quantityKg: '',
  date: todayIso(),
  destination: 'Dos Panca',
  origin: 'Campo',
  remito: '',
  bags: '',
  averageKg: '',
  caliber: '',
  category: '',
  bagColor: '',
  threadColor: '',
  transporter: '',
  client: '',
  dtv: '',
  notes: '',
  campaign: '2026',
  producer: 'Papasud',
};

export function StockIntakeForm({
  locations,
  onClose,
  onLoaded,
}: {
  locations: Location[];
  onClose: () => void;
  onLoaded: (confirmation: PlanillaImportConfirmation) => Promise<void>;
}) {
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<PlanillaImportPreview>();
  const [error, setError] = useState<string>();
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const destinations = useMemo(() => {
    const names = [...locations.map((item) => item.name), ...PLANILLA_DESTINATIONS];
    return [...new Set(names)];
  }, [locations]);

  function patch<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setPreview(undefined);
    setError(undefined);
  }

  function toInput(): StockIntakeInput {
    return {
      lotCode: form.lotCode,
      variety: form.variety,
      quantityKg: Number(form.quantityKg.replace(',', '.')),
      date: form.date,
      destination: form.destination,
      origin: form.origin || undefined,
      remito: form.remito || undefined,
      bags: optionalNumber(form.bags),
      averageKg: optionalNumber(form.averageKg),
      caliber: form.caliber || undefined,
      category: form.category || undefined,
      bagColor: form.bagColor || undefined,
      threadColor: form.threadColor || undefined,
      transporter: form.transporter || undefined,
      client: form.client || undefined,
      dtv: form.dtv || undefined,
      notes: form.notes || undefined,
      campaign: form.campaign || undefined,
      producer: form.producer || undefined,
    };
  }

  async function validate(event: FormEvent) {
    event.preventDefault();
    setIsValidating(true);
    setError(undefined);
    try {
      const next = await previewStockIntake(toInput());
      setPreview(next);
      if (!next.valid) setError(next.issues[0]?.message ?? 'Revisá los datos de la carga.');
    } catch (cause) {
      setPreview(undefined);
      setError(cause instanceof Error ? cause.message : 'No se pudo validar la carga.');
    } finally {
      setIsValidating(false);
    }
  }

  async function confirm() {
    if (!preview?.valid) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await onLoaded(await confirmStockIntake(toInput()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el stock.');
    } finally {
      setIsSaving(false);
    }
  }

  const row = preview?.sample[0];

  return (
    <section className="mb-4 border border-[#d8dad3] bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e746b]">Ingreso operativo</p>
          <h2 className="mt-1 text-[15px] font-semibold text-[#20231f]">Cargar stock</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#6b7068]">
            Completá los mismos datos de la planilla de movimientos: lote, variedad, kilos, destino, remito, bolsas, calibre y DTV.
          </p>
        </div>
        <Button variant="ghost" onClick={onClose} type="button"><X size={14} /> Cerrar</Button>
      </div>

      <form onSubmit={(event) => void validate(event)} className="space-y-4">
        <fieldset className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Identificación</legend>
          <Field label="Lote" required>
            <input className="field mt-1 min-h-10 text-[12px]" value={form.lotCode} onChange={(event) => patch('lotCode', event.target.value)} placeholder="241" required />
          </Field>
          <Field label="Variedad" required>
            <input className="field mt-1 min-h-10 text-[12px]" list="intake-varieties" value={form.variety} onChange={(event) => patch('variety', event.target.value)} placeholder="Agata" required />
            <datalist id="intake-varieties">{VARIETIES.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>
          <Field label="Fecha" required>
            <input className="field mt-1 min-h-10 text-[12px]" type="date" value={form.date} onChange={(event) => patch('date', event.target.value)} required />
          </Field>
          <Field label="Remito">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.remito} onChange={(event) => patch('remito', event.target.value)} placeholder="1001" />
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Cantidades</legend>
          <Field label="Kilos" required>
            <input className="field mt-1 min-h-10 text-[12px]" inputMode="decimal" value={form.quantityKg} onChange={(event) => patch('quantityKg', event.target.value)} placeholder="35160" required />
          </Field>
          <Field label="Bolsas">
            <input className="field mt-1 min-h-10 text-[12px]" inputMode="numeric" value={form.bags} onChange={(event) => patch('bags', event.target.value)} placeholder="705" />
          </Field>
          <Field label="Kg promedio">
            <input className="field mt-1 min-h-10 text-[12px]" inputMode="decimal" value={form.averageKg} onChange={(event) => patch('averageKg', event.target.value)} placeholder="49,87" />
          </Field>
          <Field label="Campaña">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.campaign} onChange={(event) => patch('campaign', event.target.value)} />
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Ubicación</legend>
          <Field label="Origen">
            <input className="field mt-1 min-h-10 text-[12px]" list="intake-origins" value={form.origin} onChange={(event) => patch('origin', event.target.value)} />
            <datalist id="intake-origins">{PLANILLA_ORIGINS.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>
          <Field label="Destino" required>
            <input className="field mt-1 min-h-10 text-[12px]" list="intake-destinations" value={form.destination} onChange={(event) => patch('destination', event.target.value)} required />
            <datalist id="intake-destinations">{destinations.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>
          <Field label="Productor">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.producer} onChange={(event) => patch('producer', event.target.value)} />
          </Field>
          <Field label="Transporte">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.transporter} onChange={(event) => patch('transporter', event.target.value)} placeholder="serantes-vera" />
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Clasificación</legend>
          <Field label="Calibre">
            <input className="field mt-1 min-h-10 text-[12px]" list="intake-calibers" value={form.caliber} onChange={(event) => patch('caliber', event.target.value)} />
            <datalist id="intake-calibers">{CALIBERS.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>
          <Field label="Categoría">
            <input className="field mt-1 min-h-10 text-[12px]" list="intake-categories" value={form.category} onChange={(event) => patch('category', event.target.value)} />
            <datalist id="intake-categories">{CATEGORIES.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>
          <Field label="Color bolsa">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.bagColor} onChange={(event) => patch('bagColor', event.target.value)} placeholder="blanca / verde / roja" />
          </Field>
          <Field label="Color hilo">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.threadColor} onChange={(event) => patch('threadColor', event.target.value)} placeholder="negro / blanco / amarillo" />
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          <legend className="col-span-full mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e746b]">Documentación</legend>
          <Field label="Cliente / comisionista">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.client} onChange={(event) => patch('client', event.target.value)} />
          </Field>
          <Field label="Nº DTV">
            <input className="field mt-1 min-h-10 text-[12px]" value={form.dtv} onChange={(event) => patch('dtv', event.target.value)} placeholder="13354667-7" />
          </Field>
          <label className="col-span-full">
            <span className="label">Observaciones</span>
            <textarea className="field mt-1 min-h-20 text-[12px]" value={form.notes} onChange={(event) => patch('notes', event.target.value)} placeholder="bolsa blanca-hilo negro, s/tamañar" />
          </label>
        </fieldset>

        {error && (
          <p className="border border-[#e4b9b4] bg-[#fdf0ee] px-3 py-2 text-[12px] text-[#943a34]">{error}</p>
        )}

        {row && preview?.valid && (
          <div className="border border-[#bfd0c2] bg-[#f4f8f4] p-3 text-[12px] text-[#2e3931]">
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#607265]">Se va a acreditar</p>
            <p className="mt-1 font-semibold">{row.lotCode} · {row.variety} · {formatKg(row.quantityKg)}</p>
            <p className="mt-0.5 text-[#5a6059]">{row.originName} → {row.destinationName}{row.remito ? ` · remito ${row.remito}` : ''}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[#e7e8e3] pt-3">
          <Button type="submit" variant="secondary" disabled={isValidating || isSaving}>
            <PackagePlus size={14} /> {isValidating ? 'Validando…' : 'Validar carga'}
          </Button>
          <Button type="button" onClick={() => void confirm()} disabled={!preview?.valid || isSaving}>
            <ShieldCheck size={14} /> {isSaving ? 'Guardando…' : 'Confirmar y cargar stock'}
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
