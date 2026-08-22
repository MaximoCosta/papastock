import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../../lib/formatters';

const COUNT_UP_MS = 700;

function useCountUp(value: string) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const match = value.match(/^(-?[\d.,]+)(.*)$/);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = match ? Number(match[1].replace(/\./g, '').replace(',', '.')) : NaN;

    if (!match || !Number.isFinite(target) || prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const suffix = match[2];
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / COUNT_UP_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(`${formatNumber(Math.round(target * eased))}${suffix}`);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return display;
}

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
  const displayValue = useCountUp(value);

  return (
    <article className="anim-fade-up relative min-h-[118px] border border-[#d9dbd4] bg-white px-5 py-4">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.075em] text-[#666b64]">{label}</p>
        <Icon size={16} color={accent} strokeWidth={1.8} />
      </div>
      <p className="tabular mt-3 text-[27px] font-semibold tracking-[-0.035em] text-[#20231f]">{displayValue}</p>
      <p className="mt-1 text-[11px] text-[#7a7e77]">{note}</p>
    </article>
  );
}

