import { exportRequirements } from '../data/requirements';
import { validateExport } from '../lib/validateExport';
import type { Lot, TraceabilityEvent } from '../types/domain';

export function analyzeExportReadiness(
  lot: Lot | undefined,
  destinationCountry: string,
  quantity: number,
  traceabilityEvents: TraceabilityEvent[],
) {
  return validateExport({
    lot,
    destinationCountry,
    quantity,
    traceabilityEvents,
    requirements: exportRequirements,
  });
}

