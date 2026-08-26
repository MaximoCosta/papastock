import type { TraceabilityEvent } from '../types/domain';

// Datos mock. A-310 omite treatment a propósito para el flujo N03.
export const initialTraceabilityEvents: TraceabilityEvent[] = [
  { id: 'trace-a204-planting', lotId: 'lot-a204', type: 'planting', date: '2026-03-10', data: { seedBatch: 'SEM-882', plot: 'Lote 14' } },
  { id: 'trace-a204-treatment', lotId: 'lot-a204', type: 'treatment', date: '2026-06-18', data: { product: 'Mancozeb', dose: '2 kg/ha' } },
  { id: 'trace-a204-harvest', lotId: 'lot-a204', type: 'harvest', date: '2026-07-20', data: { netWeight: 25000 } },
  { id: 'trace-a204-verify', lotId: 'lot-a204', type: 'stock_verification', date: '2026-08-21', locationId: 'loc-south', data: { verifiedQuantity: 24000 } },
  { id: 'trace-a310-planting', lotId: 'lot-a310', type: 'planting', date: '2026-03-14', data: { seedBatch: 'SEM-901', plot: 'Lote 7' } },
  { id: 'trace-a310-quality', lotId: 'lot-a310', type: 'quality_control', date: '2026-07-18', data: { dryMatter: '21.4%', result: 'Aprobado' } },
  { id: 'trace-a310-harvest', lotId: 'lot-a310', type: 'harvest', date: '2026-07-28', data: { netWeight: 22000 } },
  { id: 'trace-a310-verify', lotId: 'lot-a310', type: 'stock_verification', date: '2026-08-21', locationId: 'loc-central', data: { verifiedQuantity: 22000 } },
  { id: 'trace-c102-planting', lotId: 'lot-c102', type: 'planting', date: '2026-03-05', data: { seedBatch: 'SEM-791' } },
  { id: 'trace-c102-harvest', lotId: 'lot-c102', type: 'harvest', date: '2026-07-15', data: { netWeight: 18500 } },
  { id: 'trace-b221-verify', lotId: 'lot-b221', type: 'stock_verification', date: '2026-08-21', locationId: 'loc-south', data: { verifiedQuantity: 15200 } },
  { id: 'trace-d405-verify', lotId: 'lot-d405', type: 'stock_verification', date: '2026-08-21', locationId: 'loc-central', data: { verifiedQuantity: 18700 } },
  { id: 'trace-e090-verify', lotId: 'lot-e090', type: 'stock_verification', date: '2026-08-20', locationId: 'loc-north', data: { verifiedQuantity: 11300 } },
  { id: 'trace-g512-verify', lotId: 'lot-g512', type: 'stock_verification', date: '2026-08-21', locationId: 'loc-south', data: { verifiedQuantity: 19800 } },
];

