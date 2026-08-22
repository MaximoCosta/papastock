import { ArrowRight, ClipboardCheck, PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatKg, formatSignedKg } from '../../lib/formatters';
import type { StockView } from '../../types/domain';
import { EmptyState } from '../common/EmptyState';
import { StockStatusBadge } from './StockStatusBadge';

export function StockTable({
  records,
  compact = false,
  onVerify,
}: {
  records: StockView[];
  compact?: boolean;
  onVerify?: (record: StockView) => void;
}) {
  if (records.length === 0) {
    return <EmptyState title="Sin resultados" description="No hay registros que coincidan con los filtros seleccionados." />;
  }

  return (
    <div className="overflow-hidden border border-[#d8dad3] bg-white">
      <div className="overflow-x-auto">
        <table className="operational-table">
          <thead>
            <tr>
              <th>Lote</th>
              {!compact && <th>Variedad</th>}
              <th>Ubicación</th>
              <th className="text-right!">Declarado</th>
              <th className="text-right!">Verificado</th>
              <th className="text-right!">Diferencia</th>
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.id} className="anim-row relative" style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}>
                <td className={record.status === 'discrepancy' ? 'border-l-[3px]! border-l-[#b64b43]!' : 'border-l-[3px]! border-l-transparent!'}>
                  <Link className="font-bold text-[#243a2d] hover:underline" to={`/lots/${record.lot.code}`}>
                    {record.lot.code}
                  </Link>
                </td>
                {!compact && <td>{record.lot.variety}</td>}
                <td>{record.location.name}</td>
                <td className="tabular text-right!">{formatKg(record.declaredQuantity)}</td>
                <td className="tabular text-right! font-medium">{record.verificationPending ? '—' : formatKg(record.verifiedQuantity)}</td>
                <td className={`tabular text-right! font-bold ${record.status === 'discrepancy' ? 'text-[#a23b35]!' : 'text-[#697068]!'}`}>
                  {record.verificationPending ? '—' : formatSignedKg(record.difference)}
                </td>
                <td><StockStatusBadge status={record.status} /></td>
                <td className="w-28 text-right!">
                  <div className="flex items-center justify-end gap-1">
                    {onVerify && (record.verificationPending || record.status === 'discrepancy') && (
                      <button
                        type="button"
                        onClick={() => onVerify(record)}
                        className="inline-flex h-8 items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#4d6a56] hover:bg-[#eef0eb]"
                      >
                        <ClipboardCheck size={13} /> Verificar
                      </button>
                    )}
                    <Link
                      to={`/lots/${record.lot.code}`}
                      aria-label={`Abrir lote ${record.lot.code}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-[#667068] hover:bg-[#eef0eb] hover:text-[#234b37]"
                    >
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex h-10 items-center gap-2 border-t border-[#e2e4de] bg-[#fafaf7] px-4 text-[10px] text-[#747970]">
        <PackageX size={13} />
        {records.length} registro{records.length === 1 ? '' : 's'} · Cantidades en kilogramos
      </div>
    </div>
  );
}

