import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: 'default' | 'danger' | 'warning';
}) {
  const accent = tone === 'danger' ? '#a2463e' : tone === 'warning' ? '#a06d1d' : '#305f45';

  return (
    <article className="relative min-h-[118px] border border-[#d9dbd4] bg-white px-5 py-4">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.075em] text-[#666b64]">{label}</p>
        <Icon size={16} color={accent} strokeWidth={1.8} />
      </div>
      <p className="tabular mt-3 text-[27px] font-semibold tracking-[-0.035em] text-[#20231f]">{value}</p>
      <p className="mt-1 text-[11px] text-[#7a7e77]">{note}</p>
    </article>
  );
}

