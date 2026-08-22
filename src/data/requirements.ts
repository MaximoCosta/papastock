import type { ExportRequirement } from '../types/export';

// Requisitos mock para demostración. No representan asesoramiento regulatorio.
export const exportRequirements: ExportRequirement[] = [
  { id: 'br-lot-code', country: 'Brasil', documentType: 'proforma', field: 'lotCode', label: 'Número de lote', required: true, source: 'lot' },
  { id: 'br-variety', country: 'Brasil', documentType: 'proforma', field: 'variety', label: 'Variedad', required: true, source: 'lot' },
  { id: 'br-quantity', country: 'Brasil', documentType: 'proforma', field: 'quantity', label: 'Peso neto', required: true, source: 'operation' },
  { id: 'br-origin', country: 'Brasil', documentType: 'proforma', field: 'origin', label: 'Origen', required: true, source: 'lot' },
  { id: 'br-treatment', country: 'Brasil', documentType: 'proforma', field: 'treatment', label: 'Tratamiento fitosanitario', required: true, source: 'traceability' },
];
