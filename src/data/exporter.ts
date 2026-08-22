/**
 * Identidad comercial de Papasud para documentos emitidos.
 * Datos de demostración: no constituyen un CUIT ni un RNE reales.
 */
export const PAPASUD_EXPORTER = {
  name: 'Papasud S.A.',
  taxId: '30-71558921-4',
  address: 'Ruta 226 Km 73.5',
  city: 'Balcarce',
  province: 'Buenos Aires',
  country: 'Argentina',
  phone: '+54 2266 42-1100',
  email: 'exportaciones@papasud.com.ar',
  senasa: 'RNE 02-0012345 · SENASA',
} as const;

export const DEFAULT_PACKING: {
  bagWeightKg: number;
  packaging: string;
  caliber: string;
  category: string;
  hsCode: string;
  bagTareKg: number;
} = {
  bagWeightKg: 25,
  packaging: 'Bolsa de malla',
  caliber: '28–55 mm',
  category: 'Semilla de papa',
  hsCode: '0701.10',
  bagTareKg: 0.15,
};

export const DEFAULT_COMMERCIAL: {
  currency: string;
  unitPrice: number;
  paymentTerms: string;
  validityDays: number;
  incoterm: string;
} = {
  currency: 'USD',
  unitPrice: 0.35,
  paymentTerms: 'T/T 30 días fecha factura',
  validityDays: 15,
  incoterm: 'FOB',
};

export interface DestinationCommercialDefaults {
  arrivalPort: string;
  buyerName: string;
  buyerTaxId: string;
  buyerAddress: string;
  buyerCity: string;
}

export const DESTINATION_DEFAULTS: Record<string, DestinationCommercialDefaults> = {
  Brasil: {
    arrivalPort: 'Santos',
    buyerName: 'Distribuidora Sul Ltda.',
    buyerTaxId: '08.441.220/0001-55',
    buyerAddress: 'Av. dos Portuários 1840',
    buyerCity: 'Santos, SP',
  },
  Chile: {
    arrivalPort: 'Valparaíso',
    buyerName: 'AgroSur SpA',
    buyerTaxId: '76.551.882-K',
    buyerAddress: 'Av. Errázuriz 1250',
    buyerCity: 'Valparaíso',
  },
  Uruguay: {
    arrivalPort: 'Montevideo',
    buyerName: 'Semillas del Litoral S.A.',
    buyerTaxId: '210345670017',
    buyerAddress: 'Rambla Portuaria 890',
    buyerCity: 'Montevideo',
  },
};
