import type { ShelfUnit } from '../types/domain';

// Estanterías en planta (fila/columna 0-indexadas). Demo hackathon.
export const shelfUnits: ShelfUnit[] = [
  { id: 'unit-n-a', locationId: 'loc-north', code: 'N-A', label: 'Pasillo A', gridRow: 0, gridCol: 0 },
  { id: 'unit-n-b', locationId: 'loc-north', code: 'N-B', label: 'Pasillo B', gridRow: 0, gridCol: 2 },
  { id: 'unit-s-a', locationId: 'loc-south', code: 'S-A', label: 'Cámara 1 · Rack A', gridRow: 0, gridCol: 0 },
  { id: 'unit-s-b', locationId: 'loc-south', code: 'S-B', label: 'Cámara 1 · Rack B', gridRow: 0, gridCol: 1 },
  { id: 'unit-s-c', locationId: 'loc-south', code: 'S-C', label: 'Cámara 2 · Rack A', gridRow: 1, gridCol: 0 },
  { id: 'unit-c-a', locationId: 'loc-central', code: 'C-A', label: 'Zona fría · Bloque A', gridRow: 0, gridCol: 0 },
  { id: 'unit-c-b', locationId: 'loc-central', code: 'C-B', label: 'Zona fría · Bloque B', gridRow: 0, gridCol: 1 },
  { id: 'unit-c-c', locationId: 'loc-central', code: 'C-C', label: 'Zona fría · Bloque C', gridRow: 1, gridCol: 0 },
  { id: 'unit-w-a', locationId: 'loc-warehouse', code: 'G-A', label: 'Galpón · Fila A', gridRow: 0, gridCol: 0 },
  { id: 'unit-w-b', locationId: 'loc-warehouse', code: 'G-B', label: 'Galpón · Fila B', gridRow: 0, gridCol: 1 },
  { id: 'unit-w-c', locationId: 'loc-warehouse', code: 'G-C', label: 'Galpón · Fila C', gridRow: 0, gridCol: 2 },
];
