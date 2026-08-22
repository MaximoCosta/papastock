import { AlertOctagon, ScanSearch } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import type { DiscrepancyAnalysis } from '../../types/export';
import { Button } from '../common/Button';
import { LoadingLabel } from '../common/LoadingLabel';
import { StatusBadge } from '../common/StatusBadge';

export function DiscrepancyPanel({
  analysis,
  isLoading,
  movementDate,
  onAnalyze,
}: {
  analysis?: DiscrepancyAnalysis;
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
        <div className="grid grid-cols-[1fr_190px] gap-8 p-5">
          <div>
            <p className="label">Posible causa</p>
            <p className="max-w-3xl text-[13px] leading-6 text-[#343832]">{analysis.cause}</p>
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
              <dt className="label">Confianza</dt>
              <dd><StatusBadge tone={analysis.confidence === 'high' ? 'success' : 'warning'}>{analysis.confidence === 'high' ? 'Alta' : analysis.confidence === 'medium' ? 'Media' : 'Baja'}</StatusBadge></dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4 text-[12px] text-[#77736b]">
          <AlertOctagon size={15} className="text-[#9a681d]" />
          El análisis buscará movimientos pendientes que coincidan con la diferencia registrada.
        </div>
      )}
    </section>
  );
}

