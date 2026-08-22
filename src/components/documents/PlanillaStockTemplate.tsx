import { formatKg, formatSignedKg } from '../../lib/formatters';
import type { StockStatus } from '../../types/domain';
import type { PlanillaStockDocument } from '../../types/export';
import { StockStatusBadge } from '../stock/StockStatusBadge';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';

export function PlanillaStockTemplate({ document }: { document: PlanillaStockDocument }) {
  const totalDeclared = document.rows.reduce((sum, row) => sum + row.declaredQuantity, 0);
  const totalVerified = document.rows
    .filter((row) => !row.verificationPending)
    .reduce((sum, row) => sum + row.verifiedQuantity, 0);

  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Planilla de stock" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-7">
          <p className="label">Alcance</p>
          <p className="text-[14px] font-semibold">{document.scope}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#737970]">{document.rows.length} lotes relevados · Cantidades en kilogramos</p>
        </div>

        <table className="operational-table w-full">
          <thead>
            <tr>
              <th>Lote</th><th>Variedad</th><th>Ubicación</th><th>Declarado</th><th>Verificado</th><th>Diferencia</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {document.rows.map((row) => (
              <tr key={row.lotCode}>
                <td className="font-bold text-[#284332]">{row.lotCode}</td>
                <td>{row.variety}</td>
                <td>{row.location}</td>
                <td className="tabular">{formatKg(row.declaredQuantity)}</td>
                <td className="tabular">{row.verificationPending ? '—' : formatKg(row.verifiedQuantity)}</td>
                <td className={`tabular ${row.difference && !row.verificationPending ? 'text-[#a33e37]' : ''}`}>{row.verificationPending ? '—' : formatSignedKg(row.difference)}</td>
                <td><StockStatusBadge status={row.status as StockStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-[300px] border border-[#cfd2ca]">
            <div className="flex items-center justify-between border-b border-[#e4e6e0] px-4 py-2.5 text-[11px] text-[#5f645d]">
              <span>Total declarado</span><span className="tabular font-semibold">{formatKg(totalDeclared)}</span>
            </div>
            <div className="flex items-center justify-between bg-[#f1f4ef] px-4 py-3 text-[13px] font-bold text-[#25412f]">
              <span>Total verificado</span><span className="tabular">{formatKg(totalVerified)}</span>
            </div>
          </div>
        </div>
      </div>

      <DocumentFooter label="Planilla de uso interno" />
    </DocumentArticle>
  );
}
