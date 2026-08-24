import { DEFAULT_PACKING } from '../data/exporter';

export interface DerivedPacking {
  bagCount: number;
  bagWeightKg: number;
  netWeightKg: number;
  tareKg: number;
  grossWeightKg: number;
  lastBagKg: number;
  homogeneous: boolean;
}

/**
 * Arma el desglose de bultos a partir del peso neto.
 * Si la cantidad no es múltiplo del envase, el último bulto lleva el remanente.
 */
export function derivePacking(
  netKg: number,
  bagWeightKg = DEFAULT_PACKING.bagWeightKg,
  bagTareKg = DEFAULT_PACKING.bagTareKg,
): DerivedPacking {
  const weight = bagWeightKg > 0 ? bagWeightKg : DEFAULT_PACKING.bagWeightKg;
  const net = Math.max(0, netKg);
  if (net === 0) {
    return {
      bagCount: 0,
      bagWeightKg: weight,
      netWeightKg: 0,
      tareKg: 0,
      grossWeightKg: 0,
      lastBagKg: 0,
      homogeneous: true,
    };
  }

  const fullBags = Math.floor(net / weight);
  const remainder = Math.round((net - fullBags * weight) * 1000) / 1000;
  const bagCount = remainder > 0 ? fullBags + 1 : Math.max(1, fullBags);
  const lastBagKg = remainder > 0 ? remainder : weight;
  const tareKg = Math.round(bagCount * bagTareKg * 1000) / 1000;
  const grossWeightKg = Math.round(net + tareKg);

  return {
    bagCount,
    bagWeightKg: weight,
    netWeightKg: net,
    tareKg,
    grossWeightKg,
    lastBagKg,
    homogeneous: remainder === 0,
  };
}

export function shippingMarks(lotCode: string, destinationCountry: string): string {
  return `PAPASUD / ${lotCode} / ${destinationCountry.toUpperCase()}`;
}

export function addUtcDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
