import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatDate } from '../../lib/formatters';

export function DocumentArticle({ children }: { children: ReactNode }) {
  return (
    <article className="print-document mx-auto max-w-[960px] border border-[#cfd2ca] bg-white shadow-[0_8px_28px_rgba(38,46,40,0.08)]">
      {children}
    </article>
  );
}

export function DocumentLetterhead({ kicker, documentId, createdAt }: { kicker: string; documentId: string; createdAt: string }) {
  return (
    <header className="flex items-start justify-between border-b-2 border-[#234b37] px-12 py-10">
      <div>
        <p className="text-[26px] font-bold tracking-[-0.035em] text-[#193c2b]">PAPASUD</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#7a8179]">Producción y comercialización</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8078]">{kicker}</p>
        <p className="tabular mt-2 text-[15px] font-semibold text-[#2a302b]">{documentId}</p>
        <p className="mt-1 text-[10px] text-[#7a8078]">Emitido el {formatDate(createdAt)}</p>
      </div>
    </header>
  );
}

export function DocumentFooter({ label = 'Documento de demostración' }: { label?: string }) {
  return (
    <footer className="flex items-center justify-between border-t border-[#dfe1da] px-12 py-5 text-[9px] uppercase tracking-[0.06em] text-[#858a82]">
      <span>PapaStock · Papasud</span>
      <span className="flex items-center gap-1.5"><Download size={11} /> {label}</span>
    </footer>
  );
}
