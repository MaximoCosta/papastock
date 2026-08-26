import type { QuantityUnit } from '../../src/types/domain';
import { buildLotStockFacts, type LotStockFactSource } from './aiOperationsFacts';
import type { LedgerClassification, LedgerCoordinateResult } from './ledgerVerifier';

/**
 * Derived Operational Facts.
 *
 * PapaStock calcula acá todo lo que puede demostrarse a partir de la proyección
 * operativa. El LLM recibe estos hechos como autoritativos y sólo los explica.
 *
 * Reglas del módulo:
 * - Puro: sin repositorio, sin I/O, sin queries. Entra `DerivedFactsSource`, sale `DerivedOperationalFacts`.
 * - `null` significa "desconocido o no calculable". Nunca se usa `0` para representar ausencia.
 * - Hechos, no hipótesis: no se infiere causalidad ni sospecha.
 * - El stock se calcula con `buildLotStockFacts`, la única fuente canónica; acá sólo se
 *   reinterpreta con semántica de nulos, nunca se recalcula.
 */

/** Orígenes citables. Coinciden con `evidence.source` para que todo recordId sea verificable. */
export type FactSourceKind = 'stock_records' | 'movements' | 'ledger' | 'traceability';

export interface FactSourceRef {
  source: FactSourceKind;
  /** `null` sólo cuando el hecho se deriva de varios registros y no existe una fila única. */
  recordId: string | null;
}

export interface DerivedLocationStockFact {
  locationId: string;
  locationLabel: string;
  declared: number;
  /** `null` cuando la verificación está pendiente: el valor persistido no es vigente. */
  verified: number | null;
  /** `verified - declared`, o `null` si `verified` es desconocido. */
  difference: number | null;
  hasDiscrepancy: boolean | null;
  verificationPending: boolean;
  sources: FactSourceRef[];
}

export interface DerivedLotStockFact {
  lotId: string;
  lotCode: string;
  unit: QuantityUnit;
  declared: number;
  /** `null` si alguna ubicación tiene verificación pendiente: la suma sería desconocida. */
  verified: number | null;
  difference: number | null;
  hasDiscrepancy: boolean | null;
  verificationPendingLocations: number;
  /** La provenance del total es la unión de `locations[].sources`; no se repite acá. */
  locations: DerivedLocationStockFact[];
}

/**
 * Hechos derivados de un movimiento.
 *
 * Sólo lleva lo que hay que *calcular*. `reference`, `kind`, `status`, `date` y las
 * ubicaciones ya viajan textuales en `context.movements` y se unen por `movementId`;
 * repetirlas acá sería duplicar el dataset sin agregar un hecho.
 *
 * Provenance: `movementId` ES la referencia al registro (`source: "movements"`).
 */
export interface DerivedMovementFact {
  movementId: string;
  occurredAt: string | null;
  /** Cantidad de líneas del movimiento, contando todos los lotes. */
  itemCount: number;
  /** Lotes distintos involucrados. Dos líneas del mismo lote cuentan como 1. */
  lotCount: number;
  multipleLots: boolean;
  /** Cantidad atribuible a los lotes consultados. Distinta de `movementQuantity`. */
  lotQuantity: number | null;
  /** Cantidad total del movimiento, sumando todos los lotes. */
  movementQuantity: number | null;
  /** `null` si las líneas mezclan unidades: no se inventan conversiones. */
  unit: QuantityUnit | null;
}

export interface DerivedLedgerFact {
  lotId: string;
  locationId: string;
  locationLabel: string;
  unit: string;
  status: LedgerClassification;
  /** Saldo reconstruido desde los movimientos. */
  reconstructed: number;
  /** Saldo declarado persistido. */
  declared: number;
  /**
   * `true` sólo significa que el ledger reconstruye el stock DECLARADO.
   * No dice nada sobre el stock verificado: mirá `verifiedDifference`.
   */
  reconciles: boolean;
  verified: number | null;
  /** `verified - declared`. Puede ser distinto de 0 aunque `reconciles` sea `true`. */
  verifiedDifference: number | null;
  verificationPending: boolean | null;
}

/**
 * Hecho de trazabilidad normalizado. Aporta la `quantity` extraída del `data` libre.
 * Provenance: `eventId` ES la referencia al registro (`source: "traceability"`).
 */
export interface DerivedTraceabilityFact {
  eventId: string;
  eventType: string;
  locationId: string | null;
  occurredAt: string | null;
  quantity: number | null;
  unit: QuantityUnit | null;
}

export type TemporalRelation = 'before' | 'after' | 'same_day';

export interface DerivedTemporalFact {
  movementId: string;
  eventId: string;
  /** Relación del movimiento respecto del evento. Sólo se emite si ambas fechas existen. */
  relation: TemporalRelation;
}

export interface DerivedOperationalFacts {
  /** Unidades cubiertas por estos hechos. No hay conversión entre unidades. */
  unitScope: QuantityUnit[];
  stock: DerivedLotStockFact[];
  movements: DerivedMovementFact[];
  ledger: DerivedLedgerFact[];
  traceability: DerivedTraceabilityFact[];
  temporal: DerivedTemporalFact[];
}

export interface DerivedFactsMovementInput {
  id: string;
  reference: string | null;
  kind: string;
  status: string;
  date: string | null;
  originLocationId: string | null;
  destinationLocationId: string | null;
}

/**
 * Líneas del movimiento SIN filtrar por lote.
 *
 * La proyección de contexto recorta los items al lote consultado, así que contarlos
 * ahí daría `lotCount = 1` para movimientos que realmente tocan varios lotes.
 * Este motor necesita el padrón completo para que `multipleLots` sea un hecho y no un artefacto.
 */
export interface DerivedFactsMovementItemInput {
  movementId: string;
  lotId: string;
  quantity: number | null;
  unit: string;
}

export interface DerivedFactsTraceabilityInput {
  id: string;
  lotId: string;
  type: string;
  date: string | null;
  locationId: string | null;
  data: Record<string, string | number | boolean>;
}

export interface DerivedFactsSource extends LotStockFactSource {
  /** Lotes en foco. Determina qué parte de cada movimiento es "del lote". */
  lots: Array<{ id: string; code: string }>;
  /** Igual que `LotStockFactSource`, pero con `id` para poder citar la fila en provenance. */
  stockRecords: Array<LotStockFactSource['stockRecords'][number] & { id: string }>;
  movements: DerivedFactsMovementInput[];
  movementItems: DerivedFactsMovementItemInput[];
  traceability: DerivedFactsTraceabilityInput[];
  ledgerCoordinates: LedgerCoordinateResult[];
}

/** Eventos que representan una verificación física; anclan las relaciones temporales. */
const VERIFICATION_EVENT_TYPES = new Set(['stock_verification', 'verification', 'stock_count']);

function toUnit(value: string): QuantityUnit | null {
  return value === 'kg' || value === 'bags' ? value : null;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stockSources(
  lotId: string,
  locationId: string,
  unit: QuantityUnit,
  source: DerivedFactsSource,
): FactSourceRef[] {
  return source.stockRecords
    .filter((record) => record.lotId === lotId && record.locationId === locationId && record.unit === unit)
    .map((record) => ({ source: 'stock_records' as const, recordId: record.id }));
}

function buildStockFacts(source: DerivedFactsSource): DerivedLotStockFact[] {
  // Fuente canónica única: no se recalcula declared/verified/difference acá.
  return buildLotStockFacts(source).map((fact) => {
    const locations: DerivedLocationStockFact[] = fact.locations.map((location) => {
      const verified = location.verificationPending ? null : location.verifiedQuantity;
      const difference = verified === null ? null : round(verified - location.declaredQuantity);
      return {
        locationId: location.locationId,
        locationLabel: location.locationName,
        declared: location.declaredQuantity,
        verified,
        difference,
        hasDiscrepancy: difference === null ? null : difference !== 0,
        verificationPending: location.verificationPending,
        sources: stockSources(fact.lotId, location.locationId, fact.unit, source),
      };
    });

    // Con una sola ubicación pendiente el total deja de ser conocido: no se suma un desconocido.
    const anyPending = fact.verificationPendingCount > 0;
    const verified = anyPending ? null : fact.totalVerified;
    const difference = verified === null ? null : round(verified - fact.totalDeclared);

    return {
      lotId: fact.lotId,
      lotCode: fact.lotCode,
      unit: fact.unit,
      declared: fact.totalDeclared,
      verified,
      difference,
      hasDiscrepancy: difference === null ? null : difference !== 0,
      verificationPendingLocations: fact.verificationPendingCount,
      locations,
    };
  });
}

function buildMovementFacts(source: DerivedFactsSource): DerivedMovementFact[] {
  const focusLotIds = new Set(source.lots.map((lot) => lot.id));
  const itemsByMovement = new Map<string, DerivedFactsMovementItemInput[]>();
  for (const item of source.movementItems) {
    const current = itemsByMovement.get(item.movementId) ?? [];
    current.push(item);
    itemsByMovement.set(item.movementId, current);
  }

  return source.movements.map((movement) => {
    const items = itemsByMovement.get(movement.id) ?? [];
    const lotIds = new Set(items.map((item) => item.lotId));
    const units = new Set(items.map((item) => item.unit));
    const focusItems = items.filter((item) => focusLotIds.has(item.lotId));

    const sum = (rows: DerivedFactsMovementItemInput[]): number | null => {
      if (rows.length === 0) return null;
      // Una sola cantidad desconocida vuelve desconocido el total.
      if (rows.some((row) => row.quantity === null)) return null;
      return round(rows.reduce((total, row) => total + (row.quantity ?? 0), 0));
    };

    return {
      movementId: movement.id,
      occurredAt: movement.date,
      itemCount: items.length,
      lotCount: lotIds.size,
      multipleLots: lotIds.size > 1,
      lotQuantity: sum(focusItems),
      movementQuantity: sum(items),
      unit: units.size === 1 ? toUnit([...units][0]) : null,
    };
  });
}

function buildLedgerFacts(source: DerivedFactsSource): DerivedLedgerFact[] {
  return source.ledgerCoordinates.map((coordinate) => {
    const pending = coordinate.verificationPending ?? null;
    const verified = pending === true || coordinate.verifiedQuantity === undefined
      ? null
      : coordinate.verifiedQuantity;
    return {
      lotId: coordinate.lotId,
      locationId: coordinate.locationId,
      locationLabel: coordinate.location,
      unit: coordinate.unit,
      status: coordinate.classification,
      reconstructed: coordinate.ledgerBalance,
      declared: coordinate.persistedBalance,
      reconciles: coordinate.classification === 'MATCH',
      verified,
      verifiedDifference: verified === null ? null : round(verified - coordinate.persistedBalance),
      verificationPending: pending,
      // Sin `sources`: un saldo de ledger se reconstruye desde varios movimientos y no
      // tiene una fila persistida que citar. Nunca se inventa un recordId para representarlo.
    };
  });
}

function buildTraceabilityFacts(source: DerivedFactsSource): DerivedTraceabilityFact[] {
  return source.traceability.map((event) => {
    const quantity = numeric(event.data.verifiedQuantity)
      ?? numeric(event.data.countedQuantity)
      ?? numeric(event.data.receivedQuantity)
      ?? numeric(event.data.quantity);
    const rawUnit = typeof event.data.unit === 'string' ? toUnit(event.data.unit) : null;
    return {
      eventId: event.id,
      eventType: event.type,
      locationId: event.locationId,
      occurredAt: event.date,
      quantity,
      unit: rawUnit,
    };
  });
}

function buildTemporalFacts(
  movements: DerivedMovementFact[],
  traceability: DerivedTraceabilityFact[],
): DerivedTemporalFact[] {
  const anchors = traceability.filter((event) => (
    VERIFICATION_EVENT_TYPES.has(event.eventType) && event.occurredAt !== null
  ));
  const facts: DerivedTemporalFact[] = [];
  for (const movement of movements) {
    if (movement.occurredAt === null) continue;
    for (const anchor of anchors) {
      const occurredAt = anchor.occurredAt as string;
      // Fechas ISO: la comparación lexicográfica preserva el orden cronológico.
      const relation: TemporalRelation = movement.occurredAt < occurredAt
        ? 'before'
        : movement.occurredAt > occurredAt ? 'after' : 'same_day';
      facts.push({ movementId: movement.movementId, eventId: anchor.eventId, relation });
    }
  }
  return facts;
}

export function buildDerivedOperationalFacts(source: DerivedFactsSource): DerivedOperationalFacts {
  const stock = buildStockFacts(source);
  const movements = buildMovementFacts(source);
  const traceability = buildTraceabilityFacts(source);
  const unitScope = [...new Set(stock.map((fact) => fact.unit))].sort();

  return {
    unitScope,
    stock,
    movements,
    ledger: buildLedgerFacts(source),
    traceability,
    temporal: buildTemporalFacts(movements, traceability),
  };
}
