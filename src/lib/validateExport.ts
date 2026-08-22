import { formatKg } from './formatters';
import type { Lot, TraceabilityEvent } from '../types/domain';
import type {
  ExportField,
  ExportValidationInput,
  ExportValidationLine,
  ExportValidationResult,
  RequirementSource,
} from '../types/export';

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sameId(left: unknown, right: unknown): boolean {
  return String(left ?? '') === String(right ?? '');
}

function eventType(event: TraceabilityEvent): string {
  const candidate = event as TraceabilityEvent & { eventType?: string; event_type?: string };
  return String(event.type ?? candidate.eventType ?? candidate.event_type ?? '');
}

function eventLotId(event: TraceabilityEvent): string {
  const candidate = event as TraceabilityEvent & { lot_id?: string };
  return String(event.lotId ?? candidate.lot_id ?? '');
}

function eventData(event: TraceabilityEvent): Record<string, unknown> {
  const data = event.data as unknown;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? { ...parsed as Record<string, unknown> }
        : {};
    } catch {
      return {};
    }
  }
  return data && typeof data === 'object' && !Array.isArray(data)
    ? { ...(data as Record<string, unknown>) }
    : {};
}

/** Producto fitosanitario registrado en el evento. Acepta alias del backend. */
export function readTreatmentProduct(event: TraceabilityEvent): string | undefined {
  const data = eventData(event);
  return text(data.product)
    ?? text(data.producto)
    ?? text(data.productName)
    ?? text(data.activeIngredient)
    ?? text(data.principioActivo)
    ?? text(data.treatment)
    ?? text(data.tratamiento);
}

export function latestTreatment(
  events: TraceabilityEvent[],
  lot?: Pick<Lot, 'id' | 'code'>,
): TraceabilityEvent | undefined {
  if (!lot) return undefined;
  return events
    .filter((event) => {
      if (eventType(event) !== 'treatment') return false;
      const lotRef = eventLotId(event);
      return sameId(lotRef, lot.id) || sameId(lotRef, lot.code);
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
}

function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC' })
    .format(new Date(`${String(date).slice(0, 10)}T12:00:00Z`));
}

function resolvedOrigin(input: ExportValidationLine & Pick<ExportValidationInput, 'lot'>): string | undefined {
  return text(input.origin) ?? text(input.lot?.origin);
}

function getFieldValue(field: ExportField, input: ExportValidationLine & Pick<ExportValidationInput, 'lot' | 'traceabilityEvents'>): string | undefined {
  const lot = input.lot;
  const treatment = latestTreatment(input.traceabilityEvents, lot);
  const product = treatment ? readTreatmentProduct(treatment) : undefined;

  switch (field) {
    case 'lotCode':
      return text(lot?.code);
    case 'variety':
      return text(lot?.variety);
    case 'quantity':
      return input.quantity && input.quantity > 0 ? formatKg(input.quantity) : undefined;
    case 'origin':
      return resolvedOrigin(input);
    case 'treatment':
      return treatment && product
        ? `${product} · ${formatEventDate(treatment.date)}`
        : undefined;
  }
}

/**
 * Procedencia del dato. Es informativa y no participa de la validez:
 * el objetivo es poder decir siempre de dónde salió cada valor del documento.
 */
function getFieldSource(field: ExportField, input: ExportValidationLine & Pick<ExportValidationInput, 'lot' | 'traceabilityEvents'>): RequirementSource | undefined {
  const lotLabel = input.lot ? `Lote ${input.lot.code}` : undefined;

  switch (field) {
    case 'lotCode':
    case 'variety':
      return lotLabel ? { label: lotLabel, detail: 'Ficha de lote' } : undefined;
    case 'origin':
      if (!resolvedOrigin(input)) return undefined;
      return text(input.origin) && text(input.origin) !== text(input.lot?.origin)
        ? { label: 'Operación', detail: 'Origen declarado en el formulario' }
        : lotLabel ? { label: lotLabel, detail: 'Ficha de lote' } : { label: 'Operación' };
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
      const treatment = latestTreatment(input.traceabilityEvents, input.lot);
      const product = treatment ? readTreatmentProduct(treatment) : undefined;
      if (!treatment || !product) return undefined;
      const origin = eventData(treatment).origin === 'operator_confirmation'
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
      origin: input.lot?.origin,
      verifiedQuantity: input.verifiedQuantity,
      stockLocationName: input.stockLocationName,
    }];

  const requirements = lines.flatMap((line) => {
    const lineInput = {
      lotId: line.lotId,
      lot: line.lot ?? (sameId(input.lot?.id, line.lotId) ? input.lot : undefined),
      quantity: line.quantity,
      origin: line.origin,
      verifiedQuantity: line.verifiedQuantity ?? input.verifiedQuantity,
      stockLocationName: line.stockLocationName ?? input.stockLocationName,
      traceabilityEvents: input.traceabilityEvents,
    };

    return applicableRequirements.map((requirement) => {
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
    });
  });

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
