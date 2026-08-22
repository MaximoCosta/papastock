import type { Movement } from '../types/domain';

// Datos mock. MV-1032 explica exactamente la diferencia de A-204.
export const movements: Movement[] = [
  {
    id: 'movement-1032',
    reference: 'MV-1032',
    lotId: 'lot-a204',
    originLocationId: 'loc-north',
    destinationLocationId: 'loc-south',
    quantity: 1000,
    date: '2026-08-20',
    status: 'pending',
  },
  {
    id: 'movement-1028',
    reference: 'MV-1028',
    lotId: 'lot-a204',
    originLocationId: 'loc-warehouse',
    destinationLocationId: 'loc-south',
    quantity: 8000,
    date: '2026-08-18',
    status: 'completed',
  },
  {
    id: 'movement-1016',
    reference: 'MV-1016',
    lotId: 'lot-a310',
    originLocationId: 'loc-warehouse',
    destinationLocationId: 'loc-central',
    quantity: 22000,
    date: '2026-08-10',
    status: 'completed',
  },
  {
    id: 'movement-1037',
    reference: 'MV-1037',
    lotId: 'lot-c102',
    originLocationId: 'loc-warehouse',
    destinationLocationId: 'loc-central',
    quantity: 500,
    date: '2026-08-21',
    status: 'cancelled',
  },
];

