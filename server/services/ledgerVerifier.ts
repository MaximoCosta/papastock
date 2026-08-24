export type LedgerUnit = 'kg' | 'bags';

export type LedgerClassification =
  | 'MATCH'
  | 'MISSING_LEDGER_BALANCE'
  | 'LEDGER_EXCEEDS_STOCK'
  | 'STOCK_RECORD_MISSING'
  | 'UNIT_MISMATCH'
  | 'INVALID_NEGATIVE_BALANCE';

export type LedgerBlockingCode =
  | 'DUPLICATE_STOCK_RECORD'
  | 'MOVEMENT_WITHOUT_ITEMS'
  | 'LEGACY_MOVEMENT_WITHOUT_ITEMS'
  | 'INVALID_CORRECTION_EFFECT'
  | 'INVALID_REFERENCE'
  | 'INVALID_UNIT'
  | 'UNSUPPORTED_LEGACY_MOVEMENT';

export type LedgerRecommendedAction =
  | 'NO_ACTION'
  | 'CANDIDATE_OPENING_BALANCE'
  | 'MANUAL_REVIEW'
  | 'BLOCKED';

export interface LedgerMovementInput {
  id: string;
  reference: string;
  kind: string;
  status: string;
  lotId?: string;
  quantity?: number;
  originLocationId?: string;
  destinationLocationId?: string;
  correctsMovementId?: string;
}

export interface LedgerMovementItemInput {
  id: string;
  movementId: string;
  lotId: string;
  quantity: number;
  unit: string;
  data?: Record<string, unknown>;
}

export interface LedgerStockInput {
  id: string;
  lotId: string;
  locationId: string;
  unit: string;
  declaredQuantity: number;
  verifiedQuantity: number;
  verificationPending: boolean;
}

export interface LedgerVerifierInput {
  lots: Array<{ id: string; code: string }>;
  locations: Array<{ id: string; name: string }>;
  movements: LedgerMovementInput[];
  movementItems: LedgerMovementItemInput[];
  stockRecords: LedgerStockInput[];
}

export interface LedgerBlockingIssue {
  code: LedgerBlockingCode;
  message: string;
  movementId?: string;
  movementItemId?: string;
  stockRecordId?: string;
  lotId?: string;
  locationId?: string;
  unit?: string;
}

export interface LedgerCoordinateResult {
  lotCode: string;
  lotId: string;
  location: string;
  locationId: string;
  unit: string;
  persistedBalance: number;
  ledgerBalance: number;
  candidateOpeningBalance: number;
  classification: LedgerClassification;
  verifiedQuantity?: number;
  verificationPending?: boolean;
  declaredVsVerified?: number;
  blockingIssues: LedgerBlockingCode[];
  recommendedAction: LedgerRecommendedAction;
}

export interface LedgerVerificationResult {
  ledgerAuthority: boolean;
  coordinates: LedgerCoordinateResult[];
  blockingIssues: LedgerBlockingIssue[];
  classificationCounts: Record<LedgerClassification, number>;
}

const VALID_UNITS = new Set<LedgerUnit>(['kg', 'bags']);
const SUPPORTED_KINDS = new Set(['transfer', 'import', 'correction', 'opening_balance']);

function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function coordinateKey(lotId: string, locationId: string, unit: string): string {
  return `${lotId}\u0000${locationId}\u0000${unit}`;
}

function pairKey(lotId: string, locationId: string): string {
  return `${lotId}\u0000${locationId}`;
}

export function verifyLedgerAuthority(input: LedgerVerifierInput): LedgerVerificationResult {
  const lots = new Map(input.lots.map((lot) => [lot.id, lot]));
  const locations = new Map(input.locations.map((location) => [location.id, location]));
  const movements = new Map(input.movements.map((movement) => [movement.id, movement]));
  const itemsByMovement = new Map<string, LedgerMovementItemInput[]>();
  const blockingIssues: LedgerBlockingIssue[] = [];
  const blockKeys = new Set<string>();

  const block = (issue: LedgerBlockingIssue) => {
    const key = [issue.code, issue.movementId, issue.movementItemId, issue.stockRecordId, issue.lotId, issue.locationId, issue.unit].join(':');
    if (blockKeys.has(key)) return;
    blockKeys.add(key);
    blockingIssues.push(issue);
  };

  for (const item of input.movementItems) {
    const current = itemsByMovement.get(item.movementId) ?? [];
    current.push(item);
    itemsByMovement.set(item.movementId, current);
    if (!movements.has(item.movementId)) {
      block({ code: 'INVALID_REFERENCE', message: 'El item referencia un movimiento inexistente.', movementItemId: item.id, movementId: item.movementId, lotId: item.lotId, unit: item.unit });
    }
  }

  const ledger = new Map<string, number>();
  const addDelta = (lotId: string, locationId: string, unit: string, quantity: number) => {
    const key = coordinateKey(lotId, locationId, unit);
    const balance = roundQuantity((ledger.get(key) ?? 0) + quantity);
    if (balance === 0) ledger.delete(key);
    else ledger.set(key, balance);
  };

  for (const movement of input.movements) {
    const items = itemsByMovement.get(movement.id) ?? [];
    if (items.length === 0) {
      block({ code: 'MOVEMENT_WITHOUT_ITEMS', message: 'El movimiento no tiene movement_items.', movementId: movement.id, lotId: movement.lotId });
      if (movement.lotId && movement.quantity != null) {
        block({ code: 'LEGACY_MOVEMENT_WITHOUT_ITEMS', message: 'El movimiento conserva lote y cantidad sólo en el header legacy.', movementId: movement.id, lotId: movement.lotId });
      } else {
        block({ code: 'UNSUPPORTED_LEGACY_MOVEMENT', message: 'El movimiento sin items no puede reconstruirse inequívocamente.', movementId: movement.id, lotId: movement.lotId });
      }
      continue;
    }
    if (!SUPPORTED_KINDS.has(movement.kind)) {
      block({ code: 'INVALID_REFERENCE', message: `Kind no soportado: ${movement.kind}.`, movementId: movement.id });
      continue;
    }
    if (movement.status === 'cancelled') continue;

    if (movement.kind === 'correction') {
      const original = movement.correctsMovementId ? movements.get(movement.correctsMovementId) : undefined;
      if (!movement.correctsMovementId || !original || original.id === movement.id || original.kind === 'correction') {
        block({ code: 'INVALID_REFERENCE', message: 'La corrección no referencia un movimiento original válido.', movementId: movement.id });
      }
      if (!movement.originLocationId || movement.destinationLocationId !== movement.originLocationId || !locations.has(movement.originLocationId)) {
        block({ code: 'INVALID_REFERENCE', message: 'La ubicación de la corrección es inválida.', movementId: movement.id, locationId: movement.destinationLocationId ?? movement.originLocationId });
      }
    } else if (movement.kind === 'opening_balance') {
      if (movement.originLocationId || !movement.destinationLocationId || !locations.has(movement.destinationLocationId)) {
        block({ code: 'INVALID_REFERENCE', message: 'El opening balance requiere únicamente una ubicación de destino válida.', movementId: movement.id, locationId: movement.destinationLocationId });
      }
    } else {
      if ((!movement.originLocationId && !movement.destinationLocationId)
        || (movement.originLocationId && movement.destinationLocationId && movement.originLocationId === movement.destinationLocationId)
        || (movement.originLocationId != null && !locations.has(movement.originLocationId))
        || (movement.destinationLocationId != null && !locations.has(movement.destinationLocationId))) {
        block({ code: 'INVALID_REFERENCE', message: 'Los endpoints del movimiento son inválidos.', movementId: movement.id });
      }
    }

    for (const item of items) {
      if (!lots.has(item.lotId)) {
        block({ code: 'INVALID_REFERENCE', message: 'El item referencia un lote inexistente.', movementId: movement.id, movementItemId: item.id, lotId: item.lotId });
        continue;
      }
      if (!VALID_UNITS.has(item.unit as LedgerUnit)) {
        block({ code: 'INVALID_UNIT', message: `Unidad inválida: ${item.unit}.`, movementId: movement.id, movementItemId: item.id, lotId: item.lotId, unit: item.unit });
        continue;
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        block({ code: 'INVALID_REFERENCE', message: 'La cantidad del item debe ser positiva.', movementId: movement.id, movementItemId: item.id, lotId: item.lotId, unit: item.unit });
        continue;
      }

      if (movement.kind === 'correction') {
        const effect = item.data?.effect;
        if (effect !== 'restore' && effect !== 'deduct') {
          block({ code: 'INVALID_CORRECTION_EFFECT', message: 'La corrección requiere effect restore o deduct.', movementId: movement.id, movementItemId: item.id, lotId: item.lotId, locationId: movement.destinationLocationId, unit: item.unit });
          continue;
        }
        if (movement.destinationLocationId && locations.has(movement.destinationLocationId)) {
          addDelta(item.lotId, movement.destinationLocationId, item.unit, effect === 'restore' ? item.quantity : -item.quantity);
        }
        continue;
      }

      if (movement.kind === 'opening_balance') {
        if (movement.destinationLocationId && locations.has(movement.destinationLocationId)) {
          addDelta(item.lotId, movement.destinationLocationId, item.unit, item.quantity);
        }
        continue;
      }

      if (movement.originLocationId && locations.has(movement.originLocationId)) {
        addDelta(item.lotId, movement.originLocationId, item.unit, -item.quantity);
      }
      if (movement.destinationLocationId && locations.has(movement.destinationLocationId)) {
        addDelta(item.lotId, movement.destinationLocationId, item.unit, item.quantity);
      }
    }
  }

  const stockByKey = new Map<string, LedgerStockInput[]>();
  for (const stock of input.stockRecords) {
    const key = coordinateKey(stock.lotId, stock.locationId, stock.unit);
    const current = stockByKey.get(key) ?? [];
    current.push(stock);
    stockByKey.set(key, current);
    if (!lots.has(stock.lotId) || !locations.has(stock.locationId)) {
      block({ code: 'INVALID_REFERENCE', message: 'El stock referencia lote o ubicación inexistente.', stockRecordId: stock.id, lotId: stock.lotId, locationId: stock.locationId, unit: stock.unit });
    }
    if (!VALID_UNITS.has(stock.unit as LedgerUnit)) {
      block({ code: 'INVALID_UNIT', message: `Unidad inválida: ${stock.unit}.`, stockRecordId: stock.id, lotId: stock.lotId, locationId: stock.locationId, unit: stock.unit });
    }
  }
  for (const records of stockByKey.values()) {
    if (records.length > 1) {
      const first = records[0];
      block({ code: 'DUPLICATE_STOCK_RECORD', message: 'Existe más de un stock_record para la misma coordenada.', stockRecordId: first.id, lotId: first.lotId, locationId: first.locationId, unit: first.unit });
    }
  }

  const keys = new Set([...stockByKey.keys(), ...ledger.keys()]);
  const stockUnitsByPair = new Map<string, Set<string>>();
  const ledgerUnitsByPair = new Map<string, Set<string>>();
  const registerUnit = (map: Map<string, Set<string>>, lotId: string, locationId: string, unit: string) => {
    const current = map.get(pairKey(lotId, locationId)) ?? new Set<string>();
    current.add(unit);
    map.set(pairKey(lotId, locationId), current);
  };
  for (const records of stockByKey.values()) {
    const first = records[0];
    registerUnit(stockUnitsByPair, first.lotId, first.locationId, first.unit);
  }
  for (const key of ledger.keys()) {
    const [lotId, locationId, unit] = key.split('\u0000');
    registerUnit(ledgerUnitsByPair, lotId, locationId, unit);
  }

  const classificationCounts: Record<LedgerClassification, number> = {
    MATCH: 0,
    MISSING_LEDGER_BALANCE: 0,
    LEDGER_EXCEEDS_STOCK: 0,
    STOCK_RECORD_MISSING: 0,
    UNIT_MISMATCH: 0,
    INVALID_NEGATIVE_BALANCE: 0,
  };

  const coordinates = [...keys].map((key): LedgerCoordinateResult => {
    const [lotId, locationId, unit] = key.split('\u0000');
    const records = stockByKey.get(key) ?? [];
    const persistedBalance = roundQuantity(records.reduce((total, record) => total + record.declaredQuantity, 0));
    const verifiedQuantity = records.length
      ? roundQuantity(records.reduce((total, record) => total + record.verifiedQuantity, 0))
      : undefined;
    const ledgerExists = ledger.has(key);
    const ledgerBalance = roundQuantity(ledger.get(key) ?? 0);
    const pair = pairKey(lotId, locationId);
    const unitMismatch = (!records.length && (stockUnitsByPair.get(pair)?.size ?? 0) > 0)
      || (!ledgerExists && (ledgerUnitsByPair.get(pair)?.size ?? 0) > 0);

    let classification: LedgerClassification;
    if (ledgerBalance < 0 || persistedBalance < 0) classification = 'INVALID_NEGATIVE_BALANCE';
    else if (unitMismatch) classification = 'UNIT_MISMATCH';
    else if (!records.length) classification = 'STOCK_RECORD_MISSING';
    else if (!ledgerExists && persistedBalance === 0) classification = 'MATCH';
    else if (!ledgerExists || ledgerBalance < persistedBalance) classification = 'MISSING_LEDGER_BALANCE';
    else if (ledgerBalance > persistedBalance) classification = 'LEDGER_EXCEEDS_STOCK';
    else classification = 'MATCH';
    classificationCounts[classification] += 1;

    const relevantBlocks = blockingIssues
      .filter((issue) => (!issue.lotId || issue.lotId === lotId)
        && (!issue.locationId || issue.locationId === locationId)
        && (!issue.unit || issue.unit === unit))
      .map((issue) => issue.code);
    const uniqueBlocks = [...new Set(relevantBlocks)];
    const candidateOpeningBalance = roundQuantity(persistedBalance - ledgerBalance);
    const recommendedAction: LedgerRecommendedAction = uniqueBlocks.length
      ? 'BLOCKED'
      : classification === 'MATCH'
        ? 'NO_ACTION'
        : classification === 'MISSING_LEDGER_BALANCE' && candidateOpeningBalance > 0
          ? 'CANDIDATE_OPENING_BALANCE'
          : 'MANUAL_REVIEW';

    return {
      lotCode: lots.get(lotId)?.code ?? lotId,
      lotId,
      location: locations.get(locationId)?.name ?? locationId,
      locationId,
      unit,
      persistedBalance,
      ledgerBalance,
      candidateOpeningBalance,
      classification,
      verifiedQuantity,
      verificationPending: records.length ? records.some((record) => record.verificationPending) : undefined,
      declaredVsVerified: verifiedQuantity == null ? undefined : roundQuantity(verifiedQuantity - persistedBalance),
      blockingIssues: uniqueBlocks,
      recommendedAction,
    };
  }).sort((left, right) => left.lotCode.localeCompare(right.lotCode)
    || left.location.localeCompare(right.location)
    || left.unit.localeCompare(right.unit));

  return {
    ledgerAuthority: blockingIssues.length === 0 && coordinates.every((coordinate) => coordinate.classification === 'MATCH'),
    coordinates,
    blockingIssues,
    classificationCounts,
  };
}
