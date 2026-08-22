import { Building2, Mail, Phone, Truck } from 'lucide-react';
import { formatKg } from '../../lib/formatters';
import type { Transporter } from '../../types/domain';
import { StatusBadge } from '../common/StatusBadge';

export function TransporterProfileCard({
  transporter,
  compact = false,
}: {
  transporter: Transporter;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="border border-[#c7dacc] bg-[#f2f7f3] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[#25412f]">{transporter.tradeName || transporter.companyName}</p>
            <p className="mt-0.5 text-[10px] text-[#617267]">{transporter.cuit} · {transporter.licensePlate}</p>
          </div>
          <StatusBadge tone={transporter.active ? 'success' : 'neutral'}>
            {transporter.active ? 'Activo' : 'Inactivo'}
          </StatusBadge>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[#5f665f]">
          <span className="inline-flex items-center gap-1"><Phone size={11} />{transporter.phone}</span>
          <span className="inline-flex items-center gap-1 truncate"><Truck size={11} />{transporter.vehicleType}</span>
          <span className="col-span-2 tabular">Capacidad {formatKg(transporter.capacityKg)} · {transporter.contactName}</span>
        </div>
      </div>
    );
  }

  return (
    <article className="border border-[#d8dad3] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-[#d4d8d0] bg-[#f1f4ef] text-[#315d43]">
            <Building2 size={16} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777c74]">Perfil transportista</p>
            <h3 className="mt-1 text-sm font-semibold text-[#2d332e]">{transporter.companyName}</h3>
            {transporter.tradeName && (
              <p className="mt-0.5 text-[11px] text-[#747970]">{transporter.tradeName}</p>
            )}
          </div>
        </div>
        <StatusBadge tone={transporter.active ? 'success' : 'neutral'}>
          {transporter.active ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[11px]">
        <div><dt className="label">CUIT</dt><dd className="mt-0.5 font-semibold tabular text-[#333832]">{transporter.cuit}</dd></div>
        <div><dt className="label">Contacto</dt><dd className="mt-0.5 font-semibold text-[#333832]">{transporter.contactName}</dd></div>
        <div><dt className="label">Teléfono</dt><dd className="mt-0.5 inline-flex items-center gap-1.5 text-[#333832]"><Phone size={12} />{transporter.phone}</dd></div>
        <div><dt className="label">Email</dt><dd className="mt-0.5 inline-flex items-center gap-1.5 truncate text-[#333832]"><Mail size={12} />{transporter.email}</dd></div>
        <div className="col-span-2">
          <dt className="label">Domicilio</dt>
          <dd className="mt-0.5 text-[#333832]">{transporter.address}, {transporter.city}, {transporter.province}</dd>
        </div>
        <div><dt className="label">Patente</dt><dd className="mt-0.5 font-semibold tabular text-[#333832]">{transporter.licensePlate}</dd></div>
        <div><dt className="label">Vehículo</dt><dd className="mt-0.5 text-[#333832]">{transporter.vehicleType}</dd></div>
        <div><dt className="label">Capacidad</dt><dd className="mt-0.5 tabular font-semibold text-[#333832]">{formatKg(transporter.capacityKg)}</dd></div>
        <div><dt className="label">Seguro</dt><dd className="mt-0.5 text-[#333832]">{transporter.insurancePolicy || '—'}</dd></div>
      </dl>

      {transporter.notes && (
        <p className="mt-4 border-t border-[#e4e6e0] pt-3 text-[11px] leading-5 text-[#5f645d]">{transporter.notes}</p>
      )}
    </article>
  );
}
