import { formatKg } from './formatters';
import type { TraceabilityEvent } from '../types/domain';
import type {
  ExportField,
  ExportValidationInput,
  ExportValidationLine,
  ExportValidationResult,
  RequirementSource,
} from '../types/export';

function latestTreatment(input: Pick<ExportValidationInput, 'traceabilityEvents'> & { lot?: ExportValidationLine['lot'] }): TraceabilityEvent | undefined {
  return input.traceabilityEvents
    .filter((event) => event.lotId === input.lot?.id && event.type === 'treatment')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC' })
    .format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
}

function getFieldValue(field: ExportField, input: ExportValidationInput & ExportValidationLine): string | undefined {
  const treatment = latestTreatment(input);

  switch (field) {
    case 'lotCode':
      return input.lot?.code;
    case 'variety':
      return input.lot?.variety;
    case 'quantity':
      return input.quantity && input.quantity > 0 ? formatKg(input.quantity) : undefined;
    case 'origin':
      return input.lot?.origin;
    case 'treatment':
      return treatment && typeof treatment.data.product === 'string'
        ? `${treatment.data.product} · ${formatEventDate(treatment.date)}`
        : undefined;
  }
}

/**
 * Procedencia del dato. Es informativa y no participa de la validez:
 * el objetivo es poder decir siempre de dónde salió cada valor del documento.
 */
function getFieldSource(field: ExportField, input: ExportValidationInput & ExportValidationLine): RequirementSource | undefined {
  const lotLabel = input.lot ? `Lote ${input.lot.code}` : undefined;

  switch (field) {
    case 'lotCode':
    case 'variety':
    case 'origin':
      return lotLabel ? { label: lotLabel, detail: 'Ficha de lote' } : undefined;
    case 'quantity': {
      if (!input.quantity || input.quantity <= 0) return undefined;
      if (input.verifiedQuantity === undefined) return { label: 'Operación', detail: 'Cantidad declarada en el formulario' };
      const withinStock = input.quantity <= input.verifiedQuantity;
      return {
        label: withinStock ? 'Stock verificado' : 'Operación',
        detail: withinStock
          ? `${formatKg(input.verifiedQuantity)} disponibles${input.stockLocationName ? ` en ${input.stockLocationName}` : ''}`
          : `Excede el stock verificado (${formatKg(input.verifiedQuantity)})`,
      };
    }
    case 'treatment': {
      const treatment = latestTreatment(input);
      if (!treatment || typeof treatment.data.product !== 'string') return undefined;
      const origin = treatment.data.origin === 'operator_confirmation'
        ? 'Confirmado por el operador'
        : 'Registro de trazabilidad';
      return { label: `Trazabilidad · ${formatEventDate(treatment.date)}`, detail: origin };
    }
  }
}

export function validateExport(input: ExportValidationInput): ExportValidationResult {
  const applicableRequirements = input.requirements.filter(
    (requirement) => requirement.country === input.destinationCountry && requirement.required,
  );

  const lines: ExportValidationLine[] = input.lines?.length
    ? input.lines
    : [{
      lotId: input.lot?.id ?? '',
      lot: input.lot,
      quantity: input.quantity ?? 0,
      verifiedQuantity: input.verifiedQuantity,
      stockLocationName: input.stockLocationName,
    }];

  const requirements = lines.flatMap((line) => applicableRequirements.map((requirement) => {
    const lineInput = { ...input, ...line };
    const value = getFieldValue(requirement.field, lineInput);
    return {
      lotId: line.lotId,
      field: requirement.field,
      label: requirement.label,
      status: value ? ('complete' as const) : ('missing' as const),
      value,
      origin: requirement.origin ?? ('STATIC_DEMO' as const),
      source: value ? getFieldSource(requirement.field, lineInput) : undefined,
    };
  }));

  const completedFields = requirements
    .filter((requirement) => requirement.status === 'complete')
    .map((requirement) => requirement.field)
    .filter((field, index, fields) => fields.indexOf(field) === index);
  const missingFields = requirements
    .filter((requirement) => requirement.status === 'missing')
    .map((requirement) => requirement.field)
    .filter((field, index, fields) => fields.indexOf(field) === index);

  return {
    valid: requirements.length > 0 && missingFields.length === 0,
    completedFields,
    missingFields,
    requirements,
  };
}
