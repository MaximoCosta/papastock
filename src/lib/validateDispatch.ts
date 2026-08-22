import type { ValidationResult } from '../types/domain';

interface DispatchValidationInput {
  requestedQuantity: number;
  declaredQuantity: number;
  verifiedQuantity: number;
  hasUnresolvedDiscrepancy: boolean;
}

export function validateDispatch({
  requestedQuantity,
  verifiedQuantity,
  hasUnresolvedDiscrepancy,
}: DispatchValidationInput): ValidationResult {
  const errors: ValidationResult['errors'] = [];

  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    errors.push({
      code: 'INVALID_QUANTITY',
      message: 'Ingresá una cantidad mayor a cero.',
    });
  }

  if (requestedQuantity > verifiedQuantity) {
    errors.push({
      code: 'INSUFFICIENT_VERIFIED_STOCK',
      message: 'La cantidad solicitada supera el stock verificado.',
    });
  }

  if (hasUnresolvedDiscrepancy) {
    errors.push({
      code: 'UNRESOLVED_DISCREPANCY',
      message: 'Este lote presenta una discrepancia de stock sin resolver.',
    });
  }

  return { valid: errors.length === 0, errors };
}

