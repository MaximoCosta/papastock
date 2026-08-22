import { useState } from 'react';
import { formatQuantity } from '../../lib/formatters';
import { movementItemsOf, movementPrimaryUnit } from '../../lib/movements';
import { receiveMovement } from '../../services/movementService';
import type { Movement } from '../../types/domain';
import { Button } from '../common/Button';

export function MovementReceptionForm({
  movements,
  enabled,
  onReceived,
}: {
  movements: Movement[];
  enabled: boolean;
  onReceived: () => Promise<void>;
}) {
  const pending = movements.filter((movement) => movement.receptionStatus === 'pending' && movement.kind !== 'correction');
  const [movementId, setMovementId] = useState(pending[0]?.id ?? '');
  const [receivedTotal, setReceivedTotal] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const selected = pending.find((movement) => movement.id === movementId) ?? pending[0];
  const items = selected ? movementItemsOf(selected) : [];
  const unit = selected ? movementPrimaryUnit(selected) : 'bags';
  const dispatched = items.reduce((total, item) => total + item.dispatchedQuantity, 0);

  if (!enabled || pending.length === 0) return null;

  async function submit() {
    if (!selected) return;
    setSaving(true);
    setError(undefined);
    try {
      await receiveMovement(selected.id, {
        date: new Date().toISOString().slice(0, 10),
        receivedTotal: Number(receivedTotal),
        unit,
      });
      await onReceived();
      setReceivedTotal('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la recepción.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-4 border border-[#d8dad3] bg-white p-4">
      <h2 className="text-sm font-semibold">Registrar recepción</h2>
      <p className="mt-1 text-[11px] text-[#747970]">
        El despacho original no se pisa. Si sólo conocés el total, no se inventa el reparto entre lotes.
      </p>
      <div className="mt-3 grid grid-cols-[1.4fr_160px_auto] items-end gap-3 max-[800px]:grid-cols-1">
        <label>
          <span className="label">Movimiento</span>
          <select className="field mt-1 min-h-10 text-[12px]" value={selected?.id ?? ''} onChange={(event) => setMovementId(event.target.value)}>
            {pending.map((movement) => (
              <option key={movement.id} value={movement.id}>
                {movement.remitoNumber ? `Remito ${movement.remitoNumber} · ` : ''}{movement.reference}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Total recibido ({unit})</span>
          <input className="field mt-1 min-h-10 text-[12px]" value={receivedTotal} onChange={(event) => setReceivedTotal(event.target.value)} placeholder={String(dispatched)} />
        </label>
        <Button onClick={submit} disabled={saving || !receivedTotal}>{saving ? 'Registrando…' : 'Registrar recepción'}</Button>
      </div>
      {selected && (
        <p className="mt-2 text-[11px] text-[#5c665e]">
          Despachado: {formatQuantity(dispatched, unit)} · {items.length} líneas
        </p>
      )}
      {error && <p className="mt-2 text-[11px] text-[#873832]">{error}</p>}
    </section>
  );
}
