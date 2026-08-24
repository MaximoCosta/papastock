import { formatQuantity } from '../../src/lib/quantity';
import type { QuantityUnit } from '../../src/types/domain';
import type { OperationsAssistantAnswer, OperationsAssistantEntity } from '../../src/types/operationsAssistant';
import type { AiOperationsContext } from './aiOperationsContext';

export interface LotStockLocationFact {
  locationId: string;
  locationName: string;
  declaredQuantity: number;
  verifiedQuantity: number;
  verificationPending: boolean;
}

export interface LotStockFact {
  lotId: string;
  lotCode: string;
  unit: QuantityUnit;
  totalDeclared: number;
  totalVerified: number;
  difference: number;
  verificationPendingCount: number;
  locations: LotStockLocationFact[];
}

export function buildLotStockFacts(context: AiOperationsContext): LotStockFact[] {
  const lots = new Map(context.lots.map((lot) => [lot.id, lot]));
  const locations = new Map(context.locations.map((location) => [location.id, location]));
  const groups = new Map<string, LotStockFact>();

  for (const record of context.stockRecords) {
    const lot = lots.get(record.lotId);
    const location = locations.get(record.locationId);
    if (!lot || !location) continue;
    const key = `${record.lotId}\u0000${record.unit}`;
    const group = groups.get(key) ?? {
      lotId: lot.id,
      lotCode: lot.code,
      unit: record.unit,
      totalDeclared: 0,
      totalVerified: 0,
      difference: 0,
      verificationPendingCount: 0,
      locations: [],
    };
    group.totalDeclared += record.declaredQuantity;
    group.totalVerified += record.verifiedQuantity;
    if (record.verificationPending) group.verificationPendingCount += 1;
    group.locations.push({
      locationId: location.id,
      locationName: location.name,
      declaredQuantity: record.declaredQuantity,
      verifiedQuantity: record.verifiedQuantity,
      verificationPending: record.verificationPending,
    });
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((fact) => ({
      ...fact,
      difference: fact.totalVerified - fact.totalDeclared,
      locations: fact.locations.sort((left, right) => (
        left.locationName.localeCompare(right.locationName, 'es')
        || left.locationId.localeCompare(right.locationId)
      )),
    }))
    .sort((left, right) => left.lotCode.localeCompare(right.lotCode, 'es') || left.unit.localeCompare(right.unit));
}

function factSentence(fact: LotStockFact): string {
  const stock = `${fact.lotCode} tiene ${formatQuantity(fact.totalDeclared, fact.unit)} de stock declarado.`;
  const verification = fact.totalVerified === fact.totalDeclared
    ? `El stock verificado coincide: ${formatQuantity(fact.totalVerified, fact.unit)}.`
    : `El stock verificado es de ${formatQuantity(fact.totalVerified, fact.unit)}, con una diferencia de ${formatQuantity(fact.difference, fact.unit)}.`;
  const pending = fact.verificationPendingCount === 0
    ? ''
    : ` Hay ${fact.verificationPendingCount} ${fact.verificationPendingCount === 1 ? 'ubicación' : 'ubicaciones'} con verificación pendiente.`;
  const locations = fact.locations.map((location) => (
    `${location.locationName}: ${formatQuantity(location.declaredQuantity, fact.unit)} declarados / `
    + `${formatQuantity(location.verifiedQuantity, fact.unit)} verificados`
    + (location.verificationPending ? ' (verificación pendiente)' : '')
  )).join('; ');
  return `${stock} ${verification}${pending} Por ubicación: ${locations}.`;
}

export function buildCanonicalLotStockAnswer(context: AiOperationsContext): OperationsAssistantAnswer {
  const facts = buildLotStockFacts(context);
  const lotEntities: OperationsAssistantEntity[] = context.lots.map((lot) => ({
    type: 'lot', id: lot.id, label: lot.code,
  }));
  const locationEntities: OperationsAssistantEntity[] = context.locations.map((location) => ({
    type: 'location', id: location.id, label: location.name,
  }));

  if (facts.length === 0) {
    return {
      answer: 'No hay registros de stock para el lote consultado; no se interpreta esa ausencia como stock cero.',
      confidence: 'high',
      dataQuality: 'incomplete',
      entities: lotEntities.slice(0, 30),
      warnings: ['Faltan registros de stock para responder con una cantidad.'],
      evidence: [{ source: 'stock_records', description: 'La proyección no contiene coordenadas de stock para el lote consultado.' }],
    };
  }

  const pendingCount = facts.reduce((total, fact) => total + fact.verificationPendingCount, 0);
  return {
    answer: facts.map(factSentence).join(' '),
    confidence: 'high',
    dataQuality: context.ledger.ledgerAuthority ? 'authoritative' : 'operational_only',
    entities: [...lotEntities, ...locationEntities].slice(0, 30),
    warnings: pendingCount === 0
      ? []
      : [`Hay ${pendingCount} ${pendingCount === 1 ? 'ubicación con verificación pendiente' : 'ubicaciones con verificación pendiente'}; el valor verificado no se considera vigente allí.`],
    evidence: facts.slice(0, 30).map((fact) => ({
      source: 'stock_records',
      description: `${fact.lotCode}/${fact.unit}: ${formatQuantity(fact.totalDeclared, fact.unit)} declarados, ${formatQuantity(fact.totalVerified, fact.unit)} verificados.`,
    })),
  };
}
