import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { visiblePages, type PageWindow } from '../../lib/pagination';

export function PaginationBar({
  window,
  onPageChange,
  noun,
}: {
  window: PageWindow;
  onPageChange: (page: number) => void;
  noun: string;
}) {
  const pages = visiblePages(window.page, window.pageCount);
  const label = window.total === 0
    ? `Sin ${noun}`
    : `${window.from}–${window.to} de ${window.total} ${noun}`;

  return (
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-t border-[#e2e4de] bg-[#fafaf7] px-4 py-2 text-[10px] text-[#747970]">
      <p>{label}</p>
      {window.pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginación">
          <PageButton
            label="Anterior"
            disabled={window.page <= 1}
            onClick={() => onPageChange(window.page - 1)}
          >
            <ChevronLeft size={13} />
          </PageButton>
          {pages.map((item, index) => (
            item === 'ellipsis' ? (
              <span key={`e-${index}`} className="px-1 text-[#9aa19a]">…</span>
            ) : (
              <PageButton
                key={item}
                label={`Página ${item}`}
                active={item === window.page}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PageButton>
            )
          ))}
          <PageButton
            label="Siguiente"
            disabled={window.page >= window.pageCount}
            onClick={() => onPageChange(window.page + 1)}
          >
            <ChevronRight size={13} />
          </PageButton>
        </nav>
      )}
    </div>
  );
}

function PageButton({
  children,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 min-w-7 items-center justify-center border px-1.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-[#234b37] bg-[#234b37] text-white'
          : 'border-[#d4d7cf] bg-white text-[#3a403b] hover:border-[#8fa896] hover:bg-[#f6f8f5]'
      }`}
    >
      {children}
    </button>
  );
}
