import { locations } from '../data/locations';
import { lots } from '../data/lots';
import type { MovementIntent, MovementInterpretation, StockTransferPreview } from '../types/domain';

export const DEMO_MOVEMENT_EXAMPLE = 'Mové 500 kg del lote A-310 del Frigorífico Central al Galpón Principal.';

const DEMO_INTENT: MovementIntent = {
  action: 'transfer',
  lotCode: 'A-310',
  quantityKg: 500,
  origin: 'Frigorífico Central',
  destination: 'Galpón Principal',
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDemoMovementOrder(text: string): boolean {
  const value = normalize(text);
  return value.includes('a-310')
    && /\b500\b/.test(value)
    && value.includes('frigorifico central')
    && value.includes('galpon principal');
}

export function isDemoMovementIntent(intent: MovementIntent): boolean {
  return intent.lotCode.toUpperCase() === DEMO_INTENT.lotCode
    && intent.quantityKg === DEMO_INTENT.quantityKg
    && normalize(intent.origin) === normalize(DEMO_INTENT.origin)
    && normalize(intent.destination) === normalize(DEMO_INTENT.destination);
}

export function demoMovementInterpretation(): MovementInterpretation {
  return { ...DEMO_INTENT, engine: 'llm' };
}

export function demoMovementPreview(): StockTransferPreview {
  const lot = lots.find((item) => item.code === 'A-310')!;
  const origin = locations.find((item) => item.name === 'Frigorífico Central')!;
  const destination = locations.find((item) => item.name === 'Galpón Principal')!;
  return {
    valid: true,
    errors: [],
    intent: { ...DEMO_INTENT },
    lot,
    origin,
    destination,
    originStock: { declaredQuantity: 22000, verifiedQuantity: 22000 },
  };
}

export function demoMovementReference(): { reference: string } {
  return { reference: 'MV-1048' };
}
