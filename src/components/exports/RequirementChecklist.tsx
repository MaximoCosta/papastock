import { AlertCircle, Check, Clock3 } from 'lucide-react';
import type { RequirementResult } from '../../types/export';

export function RequirementChecklist({ requirements }: { requirements: RequirementResult[] }) {
  return (
    <section className="border border-[#d6d9d1] bg-white">
      <div className="flex items-center justify-between border-b border-[#e0e2dc] px-5 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-[#2a2f2a]">Requisitos</h2>
          <p className="mt-0.5 text-[10px] text-[#7b8078]">Validación determinística contra datos y trazabilidad.</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Paso 02</span>
      </div>
      <div className="divide-y divide-[#e6e8e2]">
        {requirements.map((requirement) => {
          const Icon = requirement.status === 'complete' ? Check : requirement.status === 'missing' ? AlertCircle : Clock3;
          const iconClass = requirement.status === 'complete'
            ? 'border-[#bfd2c3] bg-[#eef5ef] text-[#346045]'
            : requirement.status === 'missing'
              ? 'border-[#e2bbb6] bg-[#fdf0ee] text-[#a23d36]'
              : 'border-[#ead5a2] bg-[#fff6df] text-[#946218]';
          return (
            <div key={requirement.field} className={`grid grid-cols-[34px_1fr_auto] items-center gap-3 px-5 py-3.5 ${requirement.status === 'missing' ? 'bg-[#fffaf9]' : ''}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-[4px] border ${iconClass}`}>
                <Icon size={14} strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-[#30352f]">{requirement.label}</p>
                <p className={`mt-0.5 text-[11px] ${requirement.status === 'missing' ? 'font-medium text-[#a23d36]' : 'text-[#747970]'}`}>
                  {requirement.value ?? 'Información no encontrada'}
                </p>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-[0.08em] ${requirement.status === 'complete' ? 'text-[#4d765b]' : 'text-[#a23d36]'}`}>
                {requirement.status === 'complete' ? 'Completo' : requirement.status === 'missing' ? 'Faltante' : 'Pendiente'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

