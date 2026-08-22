import { ArrowRight, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatDate, formatKg } from '../../lib/formatters';
import type { Location, Lot, Movement, MovementStatus, Transporter } from '../../types/domain';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { TransporterProfileCard } from '../transporters/TransporterProfileCard';

function statusMeta(status: MovementStatus): { tone: 'success' | 'warning' | 'neutral'; label: string } {
  if (status === 'completed') return { tone: 'success', label: 'Completado' };
  if (status === 'pending') return { tone: 'warning', label: 'Pendiente' };
  return { tone: 'neutral', label: 'Cancelado' };
}

export function MovementsPanel({
  movements,
  locations,
  lots,
  transporters,
  onAdd,
}: {
  movements: Movement[];
  locations: Location[];
  lots: Lot[];
  transporters: Transporter[];
  onAdd: (movement: Movement) => void;
}) {
  const activeTransporters = transporters.filter((item) => item.active);
  const [open, setOpen] = useState(false);
  const [lotId, setLotId] = useState(lots[0]?.id ?? '');
  const [originLocationId, setOriginLocationId] = useState(locations[0]?.id ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(locations[1]?.id ?? locations[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1000');
  const [status, setStatus] = useState<MovementStatus>('pending');
  const [transporterId, setTransporterId] = useState(activeTransporters[0]?.id ?? '');

  const selectedTransporter = transporters.find((item) => item.id === transporterId);

  function submit(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!lotId || !Number.isFinite(qty) || qty <= 0) return;

    const nextRef = `MV-${1040 + movements.length}`;
    onAdd({
      id: `movement-${Date.now()}`,
      reference: nextRef,
      lotId,
      originLocationId: originLocationId || undefined,
      destinationLocationId: destinationLocationId || undefined,
      quantity: qty,
      date: new Date().toISOString().slice(0, 10),
      status,
      transporterId: transporterId || undefined,
    });
    setOpen(false);
    setQuantity('1000');
    setStatus('pending');
  }

  const locationName = (id?: string) => locations.find((item) => item.id === id)?.name ?? 'Externo';
  const lotCode = (id: string) => lots.find((item) => item.id === id)?.code ?? id;
  const transporterLabel = (movement: Movement) => {
    if (movement.transporterId) {
      const transporter = transporters.find((item) => item.id === movement.transporterId);
      if (transporter) return transporter.tradeName || transporter.companyName;
    }
    const imported = movement.data?.transporter;
    return typeof imported === 'string' && imported.trim() ? imported : '—';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#747970]">{movements.length} movimientos registrados (demo local)</p>
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          <Plus size={14} /> {open ? 'Cerrar' : 'Nuevo movimiento'}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border border-[#d8dad3] bg-white p-4">
          <form onSubmit={submit} className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr_120px_130px_auto] items-end gap-3 max-[1200px]:grid-cols-2">
            <label>
              <span className="label">Lote</span>
              <select className="field mt-1 min-h-10 text-[12px]" value={lotId} onChange={(e) => setLotId(e.target.value)}>
                {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.code}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Origen</span>
              <select className="field mt-1 min-h-10 text-[12px]" value={originLocationId} onChange={(e) => setOriginLocationId(e.target.value)}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Destino</span>
              <select className="field mt-1 min-h-10 text-[12px]" value={destinationLocationId} onChange={(e) => setDestinationLocationId(e.target.value)}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Transportista</span>
              <select className="field mt-1 min-h-10 text-[12px]" value={transporterId} onChange={(e) => setTransporterId(e.target.value)}>
                <option value="">Sin transportista</option>
                {activeTransporters.map((transporter) => (
                  <option key={transporter.id} value={transporter.id}>
                    {transporter.tradeName || transporter.companyName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Cantidad (kg)</span>
              <input className="field mt-1 min-h-10 text-[12px]" value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="numeric" />
            </label>
            <label>
              <span className="label">Estado</span>
              <select className="field mt-1 min-h-10 text-[12px]" value={status} onChange={(e) => setStatus(e.target.value as MovementStatus)}>
                <option value="pending">Pendiente</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>
            <Button type="submit">Registrar</Button>
          </form>
          {selectedTransporter && <TransporterProfileCard transporter={selectedTransporter} compact />}
        </div>
      )}

      <div className="overflow-hidden border border-[#d8dad3] bg-white">
        <table className="operational-table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Lote</th>
              <th>Ruta</th>
              <th>Transportista</th>
              <th className="text-right!">Cantidad</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => {
              const meta = statusMeta(movement.status);
              return (
                <tr key={movement.id}>
                  <td className="font-bold text-[#284332]">{movement.reference}</td>
                  <td>{lotCode(movement.lotId)}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[#5a6059]">
                      <span className="truncate">{locationName(movement.originLocationId)}</span>
                      <ArrowRight size={12} className="shrink-0 text-[#9b9f98]" />
                      <span className="truncate">{locationName(movement.destinationLocationId)}</span>
                    </span>
                  </td>
                  <td className="text-[11px]">{transporterLabel(movement)}</td>
                  <td className="tabular text-right! font-semibold">{formatKg(movement.quantity)}</td>
                  <td className="tabular">{formatDate(movement.date)}</td>
                  <td><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
