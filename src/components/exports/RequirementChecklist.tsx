import { AlertCircle, Check, Clock3 } from 'lucide-react';
import type { Lot } from '../../types/domain';
import type { AnalysisEngine, RequirementResult } from '../../types/export';

function originLabel(requirements: RequirementResult[]): string {
  return requirements.some((requirement) => requirement.origin === 'AI_PARSED')
    ? 'Requisitos interpretados'
    : 'Requisitos de demo';
}

/** Un grupo por lote, en el mismo orden en que se cargaron las líneas de la operación. */
function groupByLot(requirements: RequirementResult[]): Array<{ lotId?: string; items: RequirementResult[] }> {
  const groups: Array<{ lotId?: string; items: RequirementResult[] }> = [];

  for (const requirement of requirements) {
    const current = groups.find((group) => group.lotId === requirement.lotId);
    if (current) current.items.push(requirement);
    else groups.push({ lotId: requirement.lotId, items: [requirement] });
  }

  return groups;
}

function RequirementRow({ requirement }: { requirement: RequirementResult }) {
  const Icon = requirement.status === 'complete' ? Check : requirement.status === 'missing' ? AlertCircle : Clock3;
  const iconClass = requirement.status === 'complete'
    ? 'border-[#bfd2c3] bg-[#eef5ef] text-[#346045]'
    : requirement.status === 'missing'
      ? 'border-[#e2bbb6] bg-[#fdf0ee] text-[#a23d36]'
      : 'border-[#ead5a2] bg-[#fff6df] text-[#946218]';

  return (
    <div className={`grid grid-cols-[34px_1fr_auto] items-start gap-3 px-5 py-3.5 ${requirement.status === 'missing' ? 'bg-[#fffaf9]' : ''}`}>
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
}

export function RequirementChecklist({
  requirements,
  lots,
  engine,
}: {
  requirements: RequirementResult[];
  lots?: Lot[];
  engine?: AnalysisEngine;
}) {
  const groups = groupByLot(requirements);
  const lotById = new Map((lots ?? []).map((lot) => [lot.id, lot]));

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

      {groups.map((group) => {
        const lot = group.lotId ? lotById.get(group.lotId) : undefined;
        const missingCount = group.items.filter((item) => item.status === 'missing').length;

        return (
          <div key={group.lotId ?? 'sin-lote'}>
            {groups.length > 1 && (
              <div className="flex items-baseline justify-between border-y border-[#e6e8e2] bg-[#f6f7f3] px-5 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#4f5a51]">
                  Lote {lot?.code ?? '—'}
                  {lot ? <span className="ml-2 font-medium normal-case tracking-normal text-[#7b8078]">{lot.variety}</span> : null}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-[0.08em] ${missingCount > 0 ? 'text-[#a23d36]' : 'text-[#4d765b]'}`}>
                  {missingCount > 0 ? `${missingCount} faltante(s)` : 'Completo'}
                </p>
              </div>
            )}
            <div className="divide-y divide-[#e6e8e2]">
              {group.items.map((requirement) => (
                <RequirementRow key={`${group.lotId ?? 'sin-lote'}-${requirement.field}`} requirement={requirement} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
