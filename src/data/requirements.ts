import type { ExportRequirement } from '../types/export';

// Requisitos mock para demostración. No representan asesoramiento regulatorio.
const baseFields: Omit<ExportRequirement, 'id' | 'country'>[] = [
  { documentType: 'proforma', field: 'lotCode', label: 'Número de lote', required: true, source: 'lot' },
  { documentType: 'proforma', field: 'variety', label: 'Variedad', required: true, source: 'lot' },
  { documentType: 'proforma', field: 'quantity', label: 'Peso neto', required: true, source: 'operation' },
  { documentType: 'proforma', field: 'origin', label: 'Origen', required: true, source: 'lot' },
  { documentType: 'proforma', field: 'treatment', label: 'Tratamiento fitosanitario', required: true, source: 'traceability' },
];

function forCountry(country: string, prefix: string): ExportRequirement[] {
  return baseFields.map((field) => ({
    ...field,
    id: `${prefix}-${field.field}`,
    country,
  }));
}

export const exportRequirements: ExportRequirement[] = [
  ...forCountry('Brasil', 'br'),
  ...forCountry('Chile', 'cl'),
  ...forCountry('Uruguay', 'uy'),
];
