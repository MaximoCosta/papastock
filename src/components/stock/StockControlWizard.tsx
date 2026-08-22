import { Camera, CheckCircle2, ClipboardCheck, LoaderCircle, Printer, RotateCcw, ScanText, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatKg, formatSignedKg } from '../../lib/formatters';
import { aiService } from '../../services/aiService';
import { mockDocumentService } from '../../services/documentService';
import type { Location, Shelf, StockControlCorrection, StockView } from '../../types/domain';
import type { PlanillaConteoDocument } from '../../types/export';
import { Button } from '../common/Button';

type WizardStep = 1 | 2 | 3;

export function StockControlWizard({
  locations,
  shelves,
  stockViews,
  onApply,
  onCreateDocument,
  onReset,
}: {
  locations: Location[];
  shelves: Shelf[];
  stockViews: StockView[];
  onApply: (corrections: StockControlCorrection[]) => void;
  onCreateDocument: (document: PlanillaConteoDocument) => void;
  onReset: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [locationId, setLocationId] = useState('all');
  const [shelfId, setShelfId] = useState('all');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string>();
  const [corrections, setCorrections] = useState<StockControlCorrection[]>([]);
  const [applied, setApplied] = useState(false);

  const locationShelves = useMemo(
    () => (locationId === 'all' ? shelves : shelves.filter((shelf) => shelf.locationId === locationId)),
    [locationId, shelves],
  );

  const scopeRecords = useMemo(() => {
    return stockViews.filter((record) => {
      const matchesLocation = locationId === 'all' || record.locationId === locationId;
      const matchesShelf = shelfId === 'all' || record.shelfId === shelfId;
      return matchesLocation && matchesShelf;
    });
  }, [locationId, shelfId, stockViews]);

  const scopeLabel = useMemo(() => {
    if (shelfId !== 'all') {
      const shelf = shelves.find((item) => item.id === shelfId);
      return shelf ? `Estantería ${shelf.code}` : 'Estantería filtrada';
    }
    if (locationId !== 'all') {
      return locations.find((item) => item.id === locationId)?.name ?? 'Ubicación filtrada';
    }
    return 'Todas las ubicaciones';
  }, [locationId, locations, shelfId, shelves]);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    setShelfId('all');
  }, [locationId]);

  function generateConteoSheet() {
    if (scopeRecords.length === 0) return;
    const document = mockDocumentService.createPlanillaConteo(scopeRecords, shelves, scopeLabel);
    onCreateDocument(document);
    navigate(`/documents/${document.id}`);
  }

  async function analyzePhoto() {
    if (!photo || scopeRecords.length === 0) return;
    setAnalyzing(true);
    setError(undefined);
    try {
      const result = await aiService.parseStockControlSheet(photo, scopeRecords);
      setCorrections(result);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo interpretar la planilla.');
    } finally {
      setAnalyzing(false);
    }
  }

  // El backend todavía no acepta eventos `stock_verification`, así que la corrección
  // queda deliberadamente en la sesión y no se envía a `POST /api/traceability`.
  function applyCorrections() {
    if (corrections.length === 0) return;
    setApplying(true);
    setError(undefined);
    try {
      onApply(corrections);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron aplicar las correcciones.');
    } finally {
      setApplying(false);
    }
  }

  async function revertSimulation() {
    setApplying(true);
    try {
      await onReset();
      setApplied(false);
      setCorrections([]);
      setStep(1);
    } finally {
      setApplying(false);
    }
  }

  function updateCounted(stockRecordId: string, value: string) {
    const qty = Number(value);
    setCorrections((current) => current.map((item) => (
      item.stockRecordId === stockRecordId && Number.isFinite(qty)
        ? { ...item, countedQuantity: qty }
        : item
    )));
  }

  return (
    <div className="space-y-4">
      <ol className="flex gap-2 text-[11px] font-semibold">
        {([1, 2, 3] as const).map((value) => (
          <li
            key={value}
            className={`flex-1 border px-3 py-2 ${
              step === value
                ? 'border-[#234b37] bg-[#e7eee8] text-[#234b37]'
                : step > value
                  ? 'border-[#c3c7be] bg-white text-[#315d43]'
                  : 'border-[#dde0d8] bg-[#fafaf7] text-[#7a7f77]'
            }`}
          >
            {value === 1 && '1 · Preparar hoja'}
            {value === 2 && '2 · Fotografiar'}
            {value === 3 && '3 · Revisar y aplicar'}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="border border-[#d8dad3] bg-white p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-[#d4d8d0] bg-[#f1f4ef] text-[#315d43]">
              <ClipboardCheck size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#2d332e]">Imprimí la planilla de conteo</h2>
              <p className="mt-1 text-[11px] leading-5 text-[#747970]">
                Elegí el alcance, imprimí la hoja, marcá cantidades en campo y después subí la foto.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 max-[900px]:grid-cols-1">
            <label>
              <span className="label">Ubicación</span>
              <select
                className="field mt-1 min-h-10 text-[12px]"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                <option value="all">Todas las ubicaciones</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Estantería</span>
              <select
                className="field mt-1 min-h-10 text-[12px]"
                value={shelfId}
                onChange={(event) => setShelfId(event.target.value)}
                disabled={locationId === 'all'}
              >
                <option value="all">Todas las estanterías</option>
                {locationShelves.map((shelf) => (
                  <option key={shelf.id} value={shelf.id}>{shelf.code} · {shelf.label}</option>
                ))}
              </select>
            </label>
            <p className="pb-2 text-[11px] text-[#747970]">{scopeRecords.length} posiciones en alcance</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={scopeRecords.length === 0} onClick={generateConteoSheet}>
              <Printer size={14} /> Generar e imprimir
            </Button>
            <Button variant="secondary" onClick={() => setStep(2)} disabled={scopeRecords.length === 0}>
              Ya tengo la hoja marcada →
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="border border-[#d8dad3] bg-white p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-[#d4d8d0] bg-[#f1f4ef] text-[#315d43]">
              <Camera size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#2d332e]">Subí la foto de la planilla</h2>
              <p className="mt-1 text-[11px] leading-5 text-[#747970]">
                La IA (mock) lee las marcas y propone correcciones sobre {scopeLabel}.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[#c3c7be] bg-[#fafaf7] px-6 py-10 hover:bg-[#f4f5f1]">
            <Upload size={22} className="text-[#6b7169]" />
            <span className="text-[12px] font-semibold text-[#30352f]">Elegir imagen o sacar foto</span>
            <span className="text-[10px] text-[#747970]">JPG, PNG · demo sin backend</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPhoto(file);
                setApplied(false);
                setCorrections([]);
              }}
            />
          </label>

          {previewUrl && (
            <div className="mt-4 overflow-hidden border border-[#d8dad3]">
              <img src={previewUrl} alt="Vista previa de la planilla" className="max-h-64 w-full object-contain bg-[#eceee8]" />
              <p className="border-t border-[#e2e4de] px-3 py-2 text-[10px] text-[#747970]">{photo?.name}</p>
            </div>
          )}

          {error && <p className="mt-3 text-[11px] font-semibold text-[#a33e37]">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>← Volver</Button>
            <Button onClick={() => void analyzePhoto()} disabled={!photo || analyzing}>
              {analyzing ? <LoaderCircle size={14} className="animate-spin" /> : <ScanText size={14} />}
              {analyzing ? 'Interpretando planilla…' : 'Interpretar planilla'}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="border border-[#d8dad3] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-[#d4d8d0] bg-[#f1f4ef] text-[#315d43]">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#2d332e]">Correcciones detectadas</h2>
                <p className="mt-1 text-[11px] leading-5 text-[#747970]">
                  Revisá o editá las cantidades antes de aplicarlas al stock.
                </p>
              </div>
            </div>
            {applied && (
              <span className="inline-flex items-center gap-1.5 border border-[#b5cfb8] bg-[#e7eee8] px-2.5 py-1 text-[10px] font-bold text-[#234b37]">
                <CheckCircle2 size={12} /> Aplicado en sesión
              </span>
            )}
          </div>

          <p className="mb-4 border-l-[3px] border-[#c9a94f] bg-[#fdf8e9] px-4 py-2.5 text-[10px] leading-4 text-[#6d5c25]">
            Demo · las correcciones quedan en esta sesión y no se escriben en PostgreSQL. Pueden
            alterar temporalmente lotes con discrepancia abierta, como A-204. Usá
            «Revertir simulación» para volver a los datos reales.
          </p>

          <div className="overflow-hidden border border-[#dde0d8]">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th className="text-right!">Antes</th>
                  <th className="text-right!">Contado</th>
                  <th className="text-right!">Δ</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((correction) => {
                  const delta = correction.countedQuantity - correction.previousVerified;
                  return (
                    <tr key={correction.stockRecordId}>
                      <td className="font-bold text-[#284332]">{correction.lotCode}</td>
                      <td className="tabular text-right!">{formatKg(correction.previousVerified)}</td>
                      <td className="text-right!">
                        <input
                          className="field ml-auto min-h-9 w-[120px] text-right text-[12px]"
                          type="number"
                          value={correction.countedQuantity}
                          disabled={applied}
                          onChange={(event) => updateCounted(correction.stockRecordId, event.target.value)}
                        />
                      </td>
                      <td className={`tabular text-right! font-bold ${delta !== 0 ? 'text-[#a33e37]' : 'text-[#697068]'}`}>
                        {formatSignedKg(delta)}
                      </td>
                      <td className="max-w-[280px] text-[11px] text-[#5f645d]">{correction.notes ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <p className="mt-3 text-[11px] font-semibold text-[#a33e37]">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep(2)} disabled={applying}>← Volver</Button>
            <Button onClick={applyCorrections} disabled={applied || applying || corrections.length === 0}>
              {applying ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {applied ? 'Correcciones aplicadas' : 'Aplicar en sesión'}
            </Button>
            {applied && (
              <Button variant="secondary" onClick={() => void revertSimulation()} disabled={applying}>
                <RotateCcw size={14} /> Revertir simulación
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
