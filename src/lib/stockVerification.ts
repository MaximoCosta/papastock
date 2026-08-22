import type {
  StockVerificationConfirmation,
  StockVerificationInput,
  StockVerificationPreview,
  StockView,
} from '../types/domain';

const PROTECTED_DEMO_LOT_CODES = new Set(['A-204', 'A-310', 'C-102', 'F-301']);

function issue(code: string, message: string): StockVerificationPreview['issues'][number] {
  return { sheet: 'verificación', rowNumber: 0, code, message };
}

export function buildStockVerificationPreview(
  input: StockVerificationInput,
  records: StockView[],
): StockVerificationPreview {
  const record = records.find((item) => item.id === input.stockRecordId);
  const countedQuantity = Number(input.countedQuantity);
  const issues: StockVerificationPreview['issues'] = [];

  if (!record) {
    issues.push(issue('RECORD_NOT_FOUND', 'Seleccioná un lote y una ubicación existentes.'));
  }

  if (record && PROTECTED_DEMO_LOT_CODES.has(record.lot.code)) {
    issues.push(issue('PROTECTED_DEMO_LOT', `El lote ${record.lot.code} es de demo y no se verifica por este formulario.`));
  }

  if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
    issues.push(issue('INVALID_QUANTITY', 'Ingresá los kilos contados (0 o más).'));
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    issues.push(issue('INVALID_DATE', 'Ingresá la fecha del conteo.'));
  }

  const declaredQuantity = record?.declaredQuantity ?? 0;
  const previousVerified = record?.verifiedQuantity ?? 0;

  return {
    valid: issues.length === 0,
    issues,
    stockRecordId: input.stockRecordId,
    lotId: record?.lotId ?? '',
    lotCode: record?.lot.code ?? '',
    variety: record?.lot.variety ?? '',
    locationId: record?.locationId ?? '',
    locationName: record?.location.name ?? '',
    declaredQuantity,
    previousVerified,
    countedQuantity: Number.isFinite(countedQuantity) ? countedQuantity : 0,
    difference: Number.isFinite(countedQuantity) ? countedQuantity - declaredQuantity : 0,
    verificationPending: Boolean(record?.verificationPending),
    date: input.date,
    bags: input.bags,
    notes: input.notes,
  };
}

export function toStockVerificationConfirmation(
  preview: StockVerificationPreview,
  persisted: boolean,
  eventId?: string,
): StockVerificationConfirmation {
  return {
    persisted,
    correction: {
      stockRecordId: preview.stockRecordId,
      lotCode: preview.lotCode,
      countedQuantity: preview.countedQuantity,
      previousVerified: preview.previousVerified,
      notes: preview.notes,
    },
    event: {
      id: eventId ?? `verify-${preview.stockRecordId}`,
      lotId: preview.lotId,
      type: 'stock_verification',
      date: preview.date,
      locationId: preview.locationId || undefined,
      data: {
        verifiedQuantity: preview.countedQuantity,
        ...(preview.bags ? { bags: preview.bags } : {}),
        ...(preview.notes ? { notes: preview.notes } : {}),
        origin: 'operator_confirmation',
      },
    },
  };
}
