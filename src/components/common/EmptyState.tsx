import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-[#c8cbc3] bg-[#f9f9f6] px-8 text-center">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-[#d4d7cf] bg-white text-[#607064]">
        <Inbox size={19} />
      </span>
      <h3 className="text-sm font-semibold text-[#2c302b]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#747970]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

