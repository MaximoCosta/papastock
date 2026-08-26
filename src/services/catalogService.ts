import type { Shelf, ShelfUnit, ShelfUnitInput, Transporter, TransporterInput } from '../types/domain';
import { apiUrl, readApiData } from './apiClient';

const jsonHeaders = { 'content-type': 'application/json', accept: 'application/json' };

export async function createTransporter(input: TransporterInput): Promise<Transporter> {
  const response = await fetch(apiUrl('/api/transporters'), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return readApiData<Transporter>(response, 'No se pudo crear el transportista.');
}

export async function updateTransporterRemote(id: string, input: TransporterInput): Promise<Transporter> {
  const response = await fetch(apiUrl(`/api/transporters/${id}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return readApiData<Transporter>(response, 'No se pudo actualizar el transportista.');
}

export async function createShelfUnit(input: ShelfUnitInput): Promise<{ unit: ShelfUnit; shelves: Shelf[] }> {
  const response = await fetch(apiUrl('/api/shelf-units'), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
  return readApiData<{ unit: ShelfUnit; shelves: Shelf[] }>(response, 'No se pudo crear la estantería.');
}

export async function deleteShelfUnitRemote(unitId: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/shelf-units/${unitId}`), {
    method: 'DELETE',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });
  if (!response.ok && response.status !== 204) {
    await readApiData(response, 'No se pudo eliminar la estantería.');
  }
}

export async function assignStockToShelfRemote(stockRecordId: string, shelfId?: string): Promise<void> {
  const response = await fetch(apiUrl('/api/stock/assign-shelf'), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ stockRecordId, shelfId }),
  });
  if (!response.ok && response.status !== 204) {
    await readApiData(response, 'No se pudo asignar el stock al estante.');
  }
}
