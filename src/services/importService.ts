import type { PlanillaImportConfirmation, PlanillaImportPreview } from '../types/domain';
import { apiRequest } from './apiClient';

/** La planilla viaja como cuerpo crudo, con su propio content-type y el nombre en un header. */
function uploadHeaders(file: File): Record<string, string> {
  return {
    'content-type': file.type || 'application/octet-stream',
    'x-filename': encodeURIComponent(file.name),
  };
}

export async function previewPlanillaImport(file: File): Promise<PlanillaImportPreview> {
  return apiRequest<PlanillaImportPreview>(
    '/api/imports/planilla/preview',
    'No se pudo leer la planilla.',
    { method: 'POST', rawBody: file, headers: uploadHeaders(file) },
  );
}

export async function confirmPlanillaImport(file: File): Promise<PlanillaImportConfirmation> {
  return apiRequest<PlanillaImportConfirmation>(
    '/api/imports/planilla',
    'No se pudo importar la planilla.',
    { method: 'POST', rawBody: file, headers: uploadHeaders(file) },
  );
}
