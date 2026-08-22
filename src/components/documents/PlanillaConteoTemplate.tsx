import { formatKg, formatNumber } from '../../lib/formatters';
import type { PlanillaConteoDocument } from '../../types/export';
import { DocumentArticle, DocumentFooter, DocumentLetterhead } from './DocumentChrome';

export function PlanillaConteoTemplate({ document }: { document: PlanillaConteoDocument }) {
  return (
    <DocumentArticle>
      <DocumentLetterhead kicker="Planilla de conteo" documentId={document.id} createdAt={document.createdAt} />

      <div className="px-12 py-10">
        <div className="mb-6 flex items-start justify-between gap-8">
          <div>
            <p className="label">Alcance del control</p>
            <p className="text-[14px] font-semibold">{document.scope}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#737970]">
              {document.rows.length} posiciones · Completá la columna Contado y marcá ✓ en campo
            </p>
          </div>
          <div className="w-[220px] border border-[#cfd2ca] px-3 py-2.5 text-[10px] leading-4 text-[#5f645d]">
            <p className="font-bold uppercase tracking-[0.08em] text-[#3d443c]">Instrucciones</p>
            <p className="mt-1.5">1. Contá físicamente cada posición.</p>
            <p>2. Anotá kg en Contado.</p>
            <p>3. Marcá ✓ si coincide o corregiste.</p>
            <p>4. Fotografiá la hoja para cargar al sistema.</p>
          </div>
        </div>

        <table className="operational-table w-full">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Variedad</th>
              <th>Ubicación</th>
              <th>Estantería</th>
              <th className="text-right!">Declarado</th>
              <th className="text-right!">Sistema</th>
              <th className="w-[110px] text-right!">Contado</th>
              <th className="w-12 text-center!">✓</th>
              <th className="w-[140px]">Notas</th>
            </tr>
          </thead>
          <tbody>
            {document.rows.map((row) => (
              <tr key={row.stockRecordId}>
                <td className="font-bold text-[#284332]">{row.lotCode}</td>
                <td>{row.variety}</td>
                <td>{row.location}</td>
                <td className="font-semibold tabular">{row.shelfCode}</td>
                <td className="tabular text-right!">{formatKg(row.declaredQuantity)}</td>
                <td className="tabular text-right!">{row.verificationPending ? '—' : formatKg(row.systemVerified)}</td>
                <td className="h-10 border border-[#cfd2ca] bg-[#fafaf7]" aria-label="Espacio para anotar contado" />
                <td className="border border-[#cfd2ca] text-center">
                  <span className="inline-block h-4 w-4 border border-[#9aa194]" aria-hidden />
                </td>
                <td className="border border-[#cfd2ca] bg-[#fafaf7]" />
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 grid grid-cols-2 gap-6 text-[11px] text-[#5f645d]">
          <div className="border border-[#cfd2ca] px-4 py-3">
            <p className="font-bold text-[#3d443c]">Operario</p>
            <p className="mt-6 border-b border-[#cfd2ca]">&nbsp;</p>
            <p className="mt-1 text-[10px]">Firma y aclaración</p>
          </div>
          <div className="border border-[#cfd2ca] px-4 py-3">
            <p className="font-bold text-[#3d443c]">Fecha / hora</p>
            <p className="mt-6 border-b border-[#cfd2ca]">&nbsp;</p>
            <p className="mt-1 text-[10px]">Total filas: {formatNumber(document.rows.length)}</p>
          </div>
        </div>
      </div>

      <DocumentFooter label="Planilla de conteo físico · Uso interno Papasud" />
    </DocumentArticle>
  );
}
