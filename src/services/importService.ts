import type { PlanillaImportConfirmation, PlanillaImportPreview } from '../types/domain';
import { apiUrl } from './apiClient';

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error ?? fallback);
  return payload.data;
}

function uploadHeaders(file: File): HeadersInit {
  return {
    'content-type': file.type || 'application/octet-stream',
    'x-filename': encodeURIComponent(file.name),
    accept: 'application/json',
  };
}

export async function previewPlanillaImport(file: File): Promise<PlanillaImportPreview> {
  const response = await fetch(apiUrl('/api/imports/planilla/preview'), {
    method: 'POST',
    headers: uploadHeaders(file),
    body: file,
  });
  return readResponse(response, 'No se pudo leer la planilla.');
}

export async function confirmPlanillaImport(file: File): Promise<PlanillaImportConfirmation> {
  const response = await fetch(apiUrl('/api/imports/planilla'), {
    method: 'POST',
    headers: uploadHeaders(file),
    body: file,
  });
  return readResponse(response, 'No se pudo importar la planilla.');
}
