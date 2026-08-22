import type { Location } from '../types/domain';

// Datos mock para la demo de PapaStock.
export const locations: Location[] = [
  { id: 'loc-north', name: 'Frigorífico Norte', type: 'cold_storage', capacityKg: 51000, temperatureC: 4 },
  { id: 'loc-south', name: 'Frigorífico Sur', type: 'cold_storage', capacityKg: 64000, temperatureC: 3.5 },
  { id: 'loc-central', name: 'Frigorífico Central', type: 'cold_storage', capacityKg: 70000, temperatureC: 4.2 },
  { id: 'loc-warehouse', name: 'Galpón Principal', type: 'warehouse', capacityKg: 83000 },
];
