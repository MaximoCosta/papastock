import { formatKg } from './formatters';
import type {
  ExportField,
  ExportValidationInput,
  ExportValidationResult,
} from '../types/export';

function getFieldValue(field: ExportField, input: ExportValidationInput): string | undefined {
  const treatment = input.traceabilityEvents
    .filter((event) => event.lotId === input.lot?.id && event.type === 'treatment')
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  switch (field) {
    case 'lotCode':
      return input.lot?.code;
    case 'variety':
      return input.lot?.variety;
    case 'quantity':
      return input.quantity > 0 ? formatKg(input.quantity) : undefined;
    case 'origin':
      return input.lot?.origin;
    case 'treatment':
      return treatment && typeof treatment.data.product === 'string'
        ? `${treatment.data.product} · ${new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC' }).format(new Date(`${treatment.date.slice(0, 10)}T12:00:00Z`))}`
        : undefined;
  }
}

export function validateExport(input: ExportValidationInput): ExportValidationResult {
  const applicableRequirements = input.requirements.filter(
    (requirement) => requirement.country === input.destinationCountry && requirement.required,
  );

  const requirements = applicableRequirements.map((requirement) => {
    const value = getFieldValue(requirement.field, input);
    return {
      field: requirement.field,
      label: requirement.label,
      status: value ? ('complete' as const) : ('missing' as const),
      value,
    };
  });

  const completedFields = requirements
    .filter((requirement) => requirement.status === 'complete')
    .map((requirement) => requirement.field);
  const missingFields = requirements
    .filter((requirement) => requirement.status === 'missing')
    .map((requirement) => requirement.field);

  return {
    valid: requirements.length > 0 && missingFields.length === 0,
    completedFields,
    missingFields,
    requirements,
  };
}

