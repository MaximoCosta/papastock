import type { Shelf } from '../types/domain';

// Estantes (niveles) por estantería. Datos mock.
export const shelves: Shelf[] = [
  { id: 'shelf-n-a1', locationId: 'loc-north', shelfUnitId: 'unit-n-a', code: 'N-A1', label: 'Pasillo A · Nivel 1', level: 1, capacityKg: 18000 },
  { id: 'shelf-n-a2', locationId: 'loc-north', shelfUnitId: 'unit-n-a', code: 'N-A2', label: 'Pasillo A · Nivel 2', level: 2, capacityKg: 18000 },
  { id: 'shelf-n-b1', locationId: 'loc-north', shelfUnitId: 'unit-n-b', code: 'N-B1', label: 'Pasillo B · Nivel 1', level: 1, capacityKg: 15000 },
  { id: 'shelf-s-a1', locationId: 'loc-south', shelfUnitId: 'unit-s-a', code: 'S-A1', label: 'Cámara 1 · Rack A · N1', level: 1, capacityKg: 22000 },
  { id: 'shelf-s-a2', locationId: 'loc-south', shelfUnitId: 'unit-s-b', code: 'S-A2', label: 'Cámara 1 · Rack B · N1', level: 1, capacityKg: 22000 },
  { id: 'shelf-s-b1', locationId: 'loc-south', shelfUnitId: 'unit-s-c', code: 'S-B1', label: 'Cámara 2 · Rack A · N1', level: 1, capacityKg: 20000 },
  { id: 'shelf-c-a1', locationId: 'loc-central', shelfUnitId: 'unit-c-a', code: 'C-A1', label: 'Bloque A · Nivel 1', level: 1, capacityKg: 25000 },
  { id: 'shelf-c-a2', locationId: 'loc-central', shelfUnitId: 'unit-c-b', code: 'C-A2', label: 'Bloque B · Nivel 1', level: 1, capacityKg: 25000 },
  { id: 'shelf-c-b1', locationId: 'loc-central', shelfUnitId: 'unit-c-c', code: 'C-B1', label: 'Bloque C · Nivel 1', level: 1, capacityKg: 20000 },
  { id: 'shelf-w-a1', locationId: 'loc-warehouse', shelfUnitId: 'unit-w-a', code: 'G-A1', label: 'Fila A · Nivel 1', level: 1, capacityKg: 30000 },
  { id: 'shelf-w-b1', locationId: 'loc-warehouse', shelfUnitId: 'unit-w-b', code: 'G-B1', label: 'Fila B · Nivel 1', level: 1, capacityKg: 28000 },
  { id: 'shelf-w-c1', locationId: 'loc-warehouse', shelfUnitId: 'unit-w-c', code: 'G-C1', label: 'Fila C · Nivel 1', level: 1, capacityKg: 25000 },
];
