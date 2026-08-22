import { FileSpreadsheet, ShieldCheck, Upload } from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';
import { formatKg, formatNumber } from '../../lib/formatters';
import { confirmPlanillaImport, previewPlanillaImport } from '../../services/importService';
import type { PlanillaImportConfirmation, PlanillaImportPreview } from '../../types/domain';
import { Button } from '../common/Button';
import { LoadingLabel } from '../common/LoadingLabel';
import { StatusBadge } from '../common/StatusBadge';

export function PlanillaImportPanel({
  fileInputRef,
  onImported,
}: {
  fileInputRef?: RefObject<HTMLInputElement | null>;
  onImported: (confirmation: PlanillaImportConfirmation) => Promise<void>;
}) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = fileInputRef ?? localInputRef;
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<PlanillaImportPreview>();
  const [result, setResult] = useState<PlanillaImportConfirmation>();
  const [error, setError] = useState<string>();
  const [isReading, setIsReading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function onFile(next: File | undefined) {
    setFile(next);
    setPreview(undefined);
    setResult(undefined);
    setError(undefined);
    if (!next) return;
    setIsReading(true);
    try {
      setPreview(await previewPlanillaImport(next));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo leer el archivo.');
    } finally {
      setIsReading(false);
    }
  }

  async function confirm() {
    if (!file || !preview?.valid) return;
    setIsConfirming(true);
    setError(undefined);
    try {
      const saved = await confirmPlanillaImport(file);
      setResult(saved);
      await onImported(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el archivo.');
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <section className="border border-[#d8dad3] bg-white p-4">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e746b]">Carga de datos</p>
          <h2 className="mt-1 text-[15px] font-semibold text-[#20231f]">Subir CSV o Excel</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#6b7068]">
            Elegí un .csv, .xls o .xlsx. El sistema arma el preview y, al confirmar, completa lotes, ubicaciones, stock y movimientos en la pantalla.
          </p>
        </div>
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={isReading || isConfirming}>
          <Upload size={14} /> {file ? 'Elegir otro archivo' : 'Subir archivo'}
        </Button>
      </div>

      {error && (
        <p className="mt-3 border border-[#e4b9b4] bg-[#fdf0ee] px-3 py-2 text-[12px] text-[#943a34]">{error}</p>
      )}

      {isReading && (
        <p className="mt-3 text-[12px] text-[#6b7068]"><LoadingLabel>Leyendo archivo…</LoadingLabel></p>
      )}

      {file && !isReading && (
        <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#5a6059]">
          <FileSpreadsheet size={14} /> {file.name}
        </p>
      )}

      {preview && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
            <PreviewStat label="Movimientos" value={formatNumber(preview.movementCount)} />
            <PreviewStat label="Kilos" value={formatKg(preview.totalKg)} />
            <PreviewStat label="Lotes nuevos" value={formatNumber(preview.newLots.length)} />
            <PreviewStat label="Ubicaciones nuevas" value={formatNumber(preview.newLocations.length)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {preview.sheets.filter((sheet) => sheet.imported > 0).map((sheet) => (
              <StatusBadge key={sheet.name} tone="success" showIcon={false}>
                {sheet.name}: {sheet.imported}
              </StatusBadge>
            ))}
            {preview.issues.length > 0 && (
              <StatusBadge tone="warning">{preview.issues.length} filas omitidas</StatusBadge>
            )}
          </div>

          {preview.sample.length > 0 && (
            <div className="overflow-hidden border border-[#e7e8e3]">
              <table className="operational-table">
                <thead>
                  <tr>
                    <th>Hoja</th>
                    <th>Fecha</th>
                    <th>Lote</th>
                    <th>Ruta</th>
                    <th className="text-right!">Kilos</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row) => (
                    <tr key={`${row.sheet}-${row.rowNumber}-${row.reference}`}>
                      <td className="text-[11px] text-[#5a6059]">{row.sheet}</td>
                      <td className="tabular">{row.date}</td>
                      <td className="font-bold text-[#284332]">{row.lotCode} · {row.variety}</td>
                      <td className="text-[12px]">{row.originName} → {row.destinationName}</td>
                      <td className="tabular text-right! font-semibold">{formatKg(row.quantityKg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.issues.slice(0, 8).length > 0 && (
            <ul className="space-y-1 text-[11px] text-[#7a5a16]">
              {preview.issues.slice(0, 8).map((issue) => (
                <li key={`${issue.sheet}-${issue.rowNumber}-${issue.code}`}>
                  {issue.sheet} · fila {issue.rowNumber}: {issue.message}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#e7e8e3] pt-3">
            <p className="mr-auto max-w-xl text-[11px] text-[#747970]">
              Los datos se ven en Stock, Lotes y Movimientos. A-204 / A-310 / C-102 / F-301 no se modifican.
            </p>
            <Button onClick={() => void confirm()} disabled={!preview.valid || isConfirming || Boolean(result)}>
              <ShieldCheck size={14} />
              {isConfirming ? 'Cargando…' : result ? 'Datos cargados' : 'Cargar en la página'}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <p className="mt-3 border border-[#bdd1c3] bg-[#edf4ee] px-3 py-2 text-[12px] text-[#28543b]">
          Listo: {formatNumber(result.createdMovements)} movimientos, {formatNumber(result.createdLots)} lotes y {formatNumber(result.createdLocations)} ubicaciones
          {result.persisted ? ' guardados en PostgreSQL.' : ' cargados en esta sesión.'}
          {result.skippedMovements > 0 ? ` ${result.skippedMovements} ya existían.` : ''}
        </p>
      )}
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e7e8e3] bg-[#f7f7f3] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#747970]">{label}</p>
      <p className="mt-1 text-[16px] font-semibold tabular text-[#234b37]">{value}</p>
    </div>
  );
}
