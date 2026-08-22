import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex min-h-16 items-start justify-between gap-8 border-b border-[#d8dad3] pb-5">
      <div>
        {eyebrow && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e746b]">{eyebrow}</p>}
        <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.025em] text-[#20231f]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#6b7068]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

