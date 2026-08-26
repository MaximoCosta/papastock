import type { Shelf, ShelfUnit, ShelfUnitInput, Transporter, TransporterInput } from '../types/domain';
import { apiRequest, apiRequestVoid } from './apiClient';

export async function createTransporter(input: TransporterInput): Promise<Transporter> {
  return apiRequest<Transporter>('/api/transporters', 'No se pudo crear el transportista.', {
    method: 'POST',
    body: input,
  });
}

export async function updateTransporterRemote(id: string, input: TransporterInput): Promise<Transporter> {
  return apiRequest<Transporter>(`/api/transporters/${id}`, 'No se pudo actualizar el transportista.', {
    method: 'PATCH',
    body: input,
  });
}

export async function createShelfUnit(input: ShelfUnitInput): Promise<{ unit: ShelfUnit; shelves: Shelf[] }> {
  return apiRequest<{ unit: ShelfUnit; shelves: Shelf[] }>(
    '/api/shelf-units',
    'No se pudo crear la estantería.',
    { method: 'POST', body: input },
  );
}

export async function deleteShelfUnitRemote(unitId: string): Promise<void> {
  await apiRequestVoid(`/api/shelf-units/${unitId}`, 'No se pudo eliminar la estantería.', {
    method: 'DELETE',
  });
}

export async function assignStockToShelfRemote(stockRecordId: string, shelfId?: string): Promise<void> {
  await apiRequestVoid('/api/stock/assign-shelf', 'No se pudo asignar el stock al estante.', {
    method: 'POST',
    body: { stockRecordId, shelfId },
  });
}
