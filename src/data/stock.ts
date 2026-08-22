import type { StockRecord } from '../types/domain';

// Cantidades expresadas en kilogramos. Datos mock.
export const stockRecords: StockRecord[] = [
  { id: 'stock-a204', lotId: 'lot-a204', locationId: 'loc-south', shelfId: 'shelf-s-a1', declaredQuantity: 25000, verifiedQuantity: 24000, updatedAt: '2026-08-21T10:30:00-03:00' },
  { id: 'stock-a310', lotId: 'lot-a310', locationId: 'loc-central', shelfId: 'shelf-c-a1', declaredQuantity: 22000, verifiedQuantity: 22000, updatedAt: '2026-08-21T09:15:00-03:00' },
  { id: 'stock-b118', lotId: 'lot-b118', locationId: 'loc-north', shelfId: 'shelf-n-a1', declaredQuantity: 14500, verifiedQuantity: 14500, updatedAt: '2026-08-20T17:20:00-03:00' },
  { id: 'stock-c102', lotId: 'lot-c102', locationId: 'loc-warehouse', shelfId: 'shelf-w-a1', declaredQuantity: 18500, verifiedQuantity: 18000, updatedAt: '2026-08-21T08:40:00-03:00' },
  { id: 'stock-b221', lotId: 'lot-b221', locationId: 'loc-south', shelfId: 'shelf-s-a2', declaredQuantity: 16000, verifiedQuantity: 16000, updatedAt: '2026-08-20T14:05:00-03:00' },
  { id: 'stock-d405', lotId: 'lot-d405', locationId: 'loc-central', shelfId: 'shelf-c-a2', declaredQuantity: 19500, verifiedQuantity: 19500, updatedAt: '2026-08-20T12:10:00-03:00' },
  { id: 'stock-e090', lotId: 'lot-e090', locationId: 'loc-north', shelfId: 'shelf-n-a2', declaredQuantity: 12500, verifiedQuantity: 12500, updatedAt: '2026-08-19T16:55:00-03:00' },
  { id: 'stock-f301', lotId: 'lot-f301', locationId: 'loc-warehouse', shelfId: 'shelf-w-b1', declaredQuantity: 17000, verifiedQuantity: 0, updatedAt: '2026-08-21T11:45:00-03:00', verificationPending: true },
  { id: 'stock-g512', lotId: 'lot-g512', locationId: 'loc-south', shelfId: 'shelf-s-b1', declaredQuantity: 21000, verifiedQuantity: 21000, updatedAt: '2026-08-20T18:00:00-03:00' },
  { id: 'stock-h118', lotId: 'lot-h118', locationId: 'loc-central', shelfId: 'shelf-c-b1', declaredQuantity: 13500, verifiedQuantity: 13500, updatedAt: '2026-08-21T07:50:00-03:00' },
];
