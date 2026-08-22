import { formatDate } from '../../lib/formatters';
import type { DocumentSnapshot } from '../../types/export';

export function DocumentProvenance({ snapshot }: { snapshot?: DocumentSnapshot }) {
  if (!snapshot) return null;

  return (
    <section className="no-print mb-4 border border-[#d8dad3] bg-white px-5 py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#747970]">Procedencia congelada</p>
          <p className="mt-1 text-[12px] text-[#333832]">
            Emitido el {formatDate(snapshot.generatedAt)} · fuente {snapshot.sourceOfTruth === 'database' ? 'PostgreSQL' : 'mock'}
          </p>
        </div>
        <p className="text-[10px] text-[#7b8078]">{snapshot.exportOperation.id}</p>
      </div>
      {snapshot.requirements.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] text-[#5f645d] max-[720px]:grid-cols-1">
          {snapshot.requirements.map((requirement) => (
            <li key={`${requirement.field}-${requirement.label}`}>
              <span className="font-semibold text-[#3f453e]">{requirement.label}:</span>{' '}
              {requirement.value ?? '—'}
              {requirement.sourceLabel ? ` · ${requirement.sourceLabel}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
