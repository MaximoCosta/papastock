import { movementItemsOf, movementTouchesLot } from './movements';
import { formatQuantity } from './quantity';
import type { Discrepancy, Location, Lot, Movement, StockCount, TraceabilityEvent } from '../types/domain';

export interface LotHistoryEntry {
  id: string;
  date: string;
  title: string;
  detail: string;
  kind: 'event' | 'transfer' | 'reception' | 'correction' | 'count' | 'discrepancy';
}

const eventLabels: Record<string, string> = {
  planting: 'Plantación',
  harvest: 'Cosecha',
  treatment: 'Tratamiento fitosanitario',
  quality_control: 'Control de calidad',
  stock_verification: 'Verificación de stock',
  reception: 'Recepción',
  correction: 'Corrección auditable',
  physical_count: 'Conteo físico',
  discrepancy: 'Discrepancia',
};

function locationName(locations: Location[], id?: string): string {
  return locations.find((item) => item.id === id)?.name ?? 'Sin ubicación';
}

export function buildLotHistory(input: {
  lot: Lot;
  events: TraceabilityEvent[];
  movements: Movement[];
  discrepancies?: Discrepancy[];
  counts?: StockCount[];
  locations: Location[];
}): LotHistoryEntry[] {
  const entries: LotHistoryEntry[] = [];

  for (const event of input.events) {
    const detail = event.type === 'treatment' ? String(event.data.product ?? 'Producto no informado')
      : event.type === 'planting' ? String(event.data.plot ?? event.data.seedBatch ?? 'Registro de campo')
        : event.type === 'harvest' && event.data.netWeight ? `${Number(event.data.netWeight).toLocaleString('es-AR')} kg ingresados`
          : event.type === 'quality_control' ? String(event.data.result ?? 'Control registrado')
            : event.type === 'stock_verification' && event.data.verifiedQuantity ? `${Number(event.data.verifiedQuantity).toLocaleString('es-AR')} verificados`
              : event.type === 'correction' ? `Corrige ${String(event.data.corrects ?? '')} · remito ${String(event.data.remitoNumber ?? '—')}`
                : event.type === 'reception' ? `${formatQuantity(Number(event.data.observedQuantity ?? 0), event.data.unit === 'bags' ? 'bags' : 'kg')} recibidos`
                  : event.type === 'physical_count' ? `Sistema ${event.data.expectedQuantity} / conteo ${event.data.observedQuantity}`
                    : 'Evento registrado';
    entries.push({
      id: event.id,
      date: event.date,
      title: eventLabels[event.type] ?? event.type,
      detail,
      kind: event.type === 'correction' || event.type === 'reception' || event.type === 'physical_count' || event.type === 'discrepancy'
        ? event.type === 'physical_count' ? 'count' : event.type
        : 'event',
    });
  }

  for (const movement of input.movements.filter((item) => movementTouchesLot(item, input.lot.id))) {
    const item = movementItemsOf(movement).find((line) => line.lotId === input.lot.id);
    const qty = item ? formatQuantity(item.dispatchedQuantity, item.unit) : formatQuantity(movement.quantity ?? 0, 'kg');
    const received = item?.receivedQuantity != null
      ? ` · recibido ${formatQuantity(item.receivedQuantity, item.unit)}`
      : movement.receptionStatus === 'pending' ? ' · recepción pendiente' : '';
    entries.push({
      id: `hist-${movement.id}`,
      date: movement.date,
      title: movement.kind === 'correction' ? 'Corrección de lote' : `Movimiento ${movement.reference}`,
      detail: [
        movement.remitoNumber ? `Remito ${movement.remitoNumber}` : null,
        `${locationName(input.locations, movement.originLocationId)} → ${locationName(input.locations, movement.destinationLocationId)}`,
        `despacho ${qty}${received}`,
      ].filter(Boolean).join(' · '),
      kind: movement.kind === 'correction' ? 'correction' : 'transfer',
    });
  }

  for (const discrepancy of input.discrepancies ?? []) {
    entries.push({
      id: discrepancy.id,
      date: discrepancy.createdAt.slice(0, 10),
      title: discrepancy.type === 'physical_count' ? 'Discrepancia de conteo' : 'Discrepancia de recepción',
      detail: `esperado ${formatQuantity(discrepancy.expectedQuantity, discrepancy.unit)} · observado ${formatQuantity(discrepancy.observedQuantity, discrepancy.unit)} · ${discrepancy.status}`,
      kind: 'discrepancy',
    });
  }

  for (const count of input.counts ?? []) {
    entries.push({
      id: count.id,
      date: count.countedAt,
      title: 'Conteo físico',
      detail: `sistema ${formatQuantity(count.expectedQuantity, count.unit)} · conteo ${formatQuantity(count.observedQuantity, count.unit)} · diferencia ${formatQuantity(count.difference, count.unit)}`,
      kind: 'count',
    });
  }

  return entries.sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title));
}
