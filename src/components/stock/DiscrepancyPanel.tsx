import { AlertOctagon, ScanSearch } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import type { DiscrepancyAnalysis } from '../../types/export';
import { Button } from '../common/Button';
import { LoadingLabel } from '../common/LoadingLabel';
import { StatusBadge } from '../common/StatusBadge';

export function DiscrepancyPanel({
  analysis,
  error,
  isLoading,
  movementDate,
  onAnalyze,
}: {
  analysis?: DiscrepancyAnalysis;
  error?: string;
  isLoading: boolean;
  movementDate?: string;
  onAnalyze: () => void;
}) {
  return (
    <section className="border border-[#dec4a3] bg-[#fffdf8]">
      <div className="flex items-center justify-between gap-4 border-b border-[#eadbc7] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center border border-[#e1c494] bg-[#fff3d9] text-[#8c5d18]">
            <ScanSearch size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#34342e]">Análisis de discrepancia</h2>
            <p className="mt-0.5 text-[11px] text-[#81776b]">Correlación asistida sobre movimientos registrados</p>
          </div>
        </div>
        {!analysis && (
          <Button onClick={onAnalyze} disabled={isLoading} variant="secondary">
            {isLoading ? <LoadingLabel>Analizando movimientos...</LoadingLabel> : 'Analizar con IA'}
          </Button>
        )}
      </div>

      {analysis ? (
        <div className="grid grid-cols-[1fr_230px] gap-8 p-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <StatusBadge tone={analysis.engine === 'llm' ? 'success' : 'warning'}>
                {analysis.engine === 'llm' ? 'Analizado con IA' : 'Análisis local de respaldo'}
              </StatusBadge>
              <span className="tabular text-[10px] text-[#777c74]">{Math.round(analysis.confidence * 100)}% confianza</span>
            </div>
            <p className="label">Resumen</p>
            <p className="max-w-3xl text-[13px] leading-6 text-[#343832]">{analysis.summary}</p>
            {analysis.hypotheses.map((item) => (
              <div key={item.title} className="mt-3 border-l-2 border-[#d8b579] pl-3">
                <p className="text-[11px] font-bold text-[#3e463f]">{item.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#687068]">{item.explanation}</p>
              </div>
            ))}
            <p className="mt-4 text-[11px] font-semibold text-[#665334]">Acción sugerida: {analysis.recommendedAction}</p>
          </div>
          <dl className="space-y-4 border-l border-[#e7ded0] pl-5">
            <div>
              <dt className="label">Movimiento relacionado</dt>
              <dd className="text-[12px] font-bold text-[#2d4034]">
                {analysis.relatedMovementReference ?? 'Sin coincidencia'}
                {movementDate && <span className="font-normal text-[#737870]"> · {formatDate(movementDate)}</span>}
              </dd>
            </div>
            <div>
              <dt className="label">Cantidad explicada</dt>
              <dd className="tabular text-[12px] font-bold text-[#356247]">{analysis.explainedQuantity.toLocaleString('es-AR')} kg</dd>
            </div>
            <div>
              <dt className="label">Sin explicar</dt>
              <dd className="tabular text-[12px] font-bold text-[#a33e37]">{analysis.unexplainedQuantity.toLocaleString('es-AR')} kg</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className={`flex items-center gap-3 px-5 py-4 text-[12px] ${error ? 'text-[#8b3c35]' : 'text-[#77736b]'}`} role={error ? 'alert' : undefined}>
          <AlertOctagon size={15} className="text-[#9a681d]" />
          {error ?? 'El análisis buscará movimientos pendientes y evidencia trazable que expliquen la diferencia.'}
        </div>
      )}
    </section>
  );
}
