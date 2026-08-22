import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Lot, StockView } from '../../types/domain';
import { StockStatusBadge } from '../stock/StockStatusBadge';

export function LotHeader({ lot, stock }: { lot: Lot; stock: StockView }) {
  const hasDiscrepancy = stock.status === 'discrepancy';
  return (
    <header className="mb-6 flex items-end justify-between gap-8 border-b border-[#d5d8d0] pb-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#70766d]">
          Lote productivo
          <span className="text-[#bdc0ba]">/</span>
          Campaña {lot.campaign}
        </div>
        <div className="flex items-baseline gap-4">
          <h1 className="tabular text-[31px] font-semibold tracking-[-0.045em] text-[#1d241f]">{lot.code}</h1>
          <span className="text-[15px] font-medium text-[#5a625b]">{lot.variety}</span>
        </div>
      </div>
      <div className={`flex items-center gap-3 border px-4 py-3 ${hasDiscrepancy ? 'border-[#e1bbb6] bg-[#fdf1ef]' : 'border-[#c8dacd] bg-[#eff5f0]'}`}>
        {hasDiscrepancy ? <AlertTriangle size={18} className="text-[#a33f38]" /> : <CheckCircle2 size={18} className="text-[#38644a]" />}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#777b74]">Estado operativo</p>
          <div className="mt-1"><StockStatusBadge status={stock.status} /></div>
        </div>
      </div>
    </header>
  );
}

