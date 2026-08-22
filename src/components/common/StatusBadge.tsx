import { AlertTriangle, Check, Clock3, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  success: 'border-[#bdd1c3] bg-[#edf4ee] text-[#28543b]',
  warning: 'border-[#ead49c] bg-[#fff7e3] text-[#865b14]',
  danger: 'border-[#e4b9b4] bg-[#fdf0ee] text-[#943a34]',
  neutral: 'border-[#d9dbd5] bg-[#f4f5f1] text-[#5f645d]',
};

const icons: Record<StatusTone, ReactNode> = {
  success: <Check size={12} strokeWidth={2.5} />,
  warning: <Clock3 size={12} strokeWidth={2.3} />,
  danger: <AlertTriangle size={12} strokeWidth={2.3} />,
  neutral: <X size={12} strokeWidth={2.3} />,
};

export function StatusBadge({
  children,
  tone = 'neutral',
  showIcon = true,
}: {
  children: ReactNode;
  tone?: StatusTone;
  showIcon?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[11px] font-bold ${toneClasses[tone]}`}>
      {showIcon && icons[tone]}
      {children}
    </span>
  );
}

