import { AlertCircle, Check, Clock3 } from 'lucide-react';
import type { AnalysisEngine, RequirementResult } from '../../types/export';

function originLabel(requirements: RequirementResult[]): string {
  return requirements.some((requirement) => requirement.origin === 'AI_PARSED')
    ? 'Requisitos interpretados'
    : 'Requisitos de demo';
}

export function RequirementChecklist({
  requirements,
  engine,
}: {
  requirements: RequirementResult[];
  engine?: AnalysisEngine;
}) {
  return (
    <section className="border border-[#d6d9d1] bg-white">
      <div className="flex items-center justify-between border-b border-[#e0e2dc] px-5 py-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-[#2a2f2a]">Requisitos</h2>
          <p className="mt-0.5 text-[10px] text-[#7b8078]">Validación determinística contra datos y trazabilidad.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8078]">Paso 02</span>
          <p className="mt-0.5 text-[9px] text-[#8b908a]">
            {originLabel(requirements)}
            {engine ? ` · motor ${engine === 'llm' ? 'IA' : 'local'}` : ''}
          </p>
        </div>
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
            <div key={requirement.field} className={`grid grid-cols-[34px_1fr_auto] items-start gap-3 px-5 py-3.5 ${requirement.status === 'missing' ? 'bg-[#fffaf9]' : ''}`}>
              <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-[4px] border ${iconClass}`}>
                <Icon size={14} strokeWidth={2.4} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#30352f]">{requirement.label}</p>
                <p className={`mt-0.5 text-[11px] ${requirement.status === 'missing' ? 'font-medium text-[#a23d36]' : 'text-[#3f453e]'}`}>
                  {requirement.value ?? 'Información no encontrada'}
                </p>
                {requirement.source && (
                  <p className="mt-1 text-[10px] text-[#7f847d]">
                    Fuente: <span className="font-semibold text-[#5d655c]">{requirement.source.label}</span>
                    {requirement.source.detail ? ` · ${requirement.source.detail}` : ''}
                  </p>
                )}
              </div>
              <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${requirement.status === 'complete' ? 'text-[#4d765b]' : 'text-[#a23d36]'}`}>
                {requirement.status === 'complete' ? 'Completo' : requirement.status === 'missing' ? 'Faltante' : 'Pendiente'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
