import { describe, expect, it } from 'vitest';
import { verifyLedgerAuthority, type LedgerVerifierInput } from './ledgerVerifier';

function baseInput(): LedgerVerifierInput {
  return {
    lots: [{ id: 'lot-a', code: 'A' }, { id: 'lot-b', code: 'B' }],
    locations: [{ id: 'origin', name: 'Origen' }, { id: 'destination', name: 'Destino' }],
    movements: [],
    movementItems: [],
    stockRecords: [],
  };
}

function transfer(kind: 'transfer' | 'import' = 'transfer') {
  return {
    id: `movement-${kind}`,
    reference: `MV-${kind}`,
    kind,
    status: 'completed',
    originLocationId: 'origin',
    destinationLocationId: 'destination',
  };
}

describe('verificador canónico de ledger', () => {
  it.each(['transfer', 'import'] as const)('aplica débitos y créditos para %s', (kind) => {
    const input = baseInput();
    input.movements = [transfer(kind)];
    input.movementItems = [{ id: 'item', movementId: `movement-${kind}`, lotId: 'lot-a', quantity: 10, unit: 'kg' }];
    input.stockRecords = [
      { id: 'stock-origin', lotId: 'lot-a', locationId: 'origin', unit: 'kg', declaredQuantity: 0, verifiedQuantity: 0, verificationPending: false },
      { id: 'stock-destination', lotId: 'lot-a', locationId: 'destination', unit: 'kg', declaredQuantity: 10, verifiedQuantity: 10, verificationPending: false },
    ];

    const result = verifyLedgerAuthority(input);
    expect(result.coordinates.map(({ locationId, ledgerBalance }) => ({ locationId, ledgerBalance }))).toEqual([
      { locationId: 'destination', ledgerBalance: 10 },
      { locationId: 'origin', ledgerBalance: -10 },
    ]);
    expect(result.classificationCounts.INVALID_NEGATIVE_BALANCE).toBe(1);
  });

  it('interpreta restore y deduct sin neutralizarlos por endpoints iguales', () => {
    const input = baseInput();
    input.movements = [
      transfer(),
      {
        id: 'correction', reference: 'MV-COR', kind: 'correction', status: 'completed',
        originLocationId: 'destination', destinationLocationId: 'destination', correctsMovementId: 'movement-transfer',
      },
    ];
    input.movementItems = [
      { id: 'transfer-item', movementId: 'movement-transfer', lotId: 'lot-b', quantity: 5, unit: 'kg' },
      { id: 'restore', movementId: 'correction', lotId: 'lot-a', quantity: 2, unit: 'kg', data: { effect: 'restore' } },
      { id: 'deduct', movementId: 'correction', lotId: 'lot-b', quantity: 2, unit: 'kg', data: { effect: 'deduct' } },
    ];

    const result = verifyLedgerAuthority(input);
    expect(result.coordinates.find((row) => row.lotId === 'lot-a' && row.locationId === 'destination')?.ledgerBalance).toBe(2);
    expect(result.coordinates.find((row) => row.lotId === 'lot-b' && row.locationId === 'destination')?.ledgerBalance).toBe(3);
  });

  it('ignora movimientos cancelados', () => {
    const input = baseInput();
    input.movements = [{ ...transfer(), status: 'cancelled' }];
    input.movementItems = [{ id: 'item', movementId: 'movement-transfer', lotId: 'lot-a', quantity: 10, unit: 'kg' }];
    input.stockRecords = [{ id: 'stock', lotId: 'lot-a', locationId: 'destination', unit: 'kg', declaredQuantity: 0, verifiedQuantity: 0, verificationPending: false }];
    const result = verifyLedgerAuthority(input);
    expect(result.coordinates).toHaveLength(1);
    expect(result.coordinates[0]).toMatchObject({ ledgerBalance: 0, classification: 'MATCH' });
  });

  it('bloquea movimientos sin items y correcciones sin effect', () => {
    const input = baseInput();
    input.movements = [
      { ...transfer(), lotId: 'lot-a', quantity: 10 },
      {
        id: 'correction', reference: 'MV-COR', kind: 'correction', status: 'completed',
        originLocationId: 'destination', destinationLocationId: 'destination', correctsMovementId: 'movement-transfer',
      },
    ];
    input.movementItems = [{ id: 'bad-effect', movementId: 'correction', lotId: 'lot-a', quantity: 1, unit: 'kg', data: {} }];
    const result = verifyLedgerAuthority(input);
    expect(result.blockingIssues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'MOVEMENT_WITHOUT_ITEMS', 'LEGACY_MOVEMENT_WITHOUT_ITEMS', 'INVALID_CORRECTION_EFFECT',
    ]));
    expect(result.ledgerAuthority).toBe(false);
  });

  it('clasifica stock sin ledger y calcula candidato sin clamp', () => {
    const input = baseInput();
    input.stockRecords = [{
      id: 'stock', lotId: 'lot-a', locationId: 'destination', unit: 'kg',
      declaredQuantity: 10, verifiedQuantity: 8, verificationPending: true,
    }];
    const row = verifyLedgerAuthority(input).coordinates[0];
    expect(row).toMatchObject({
      classification: 'MISSING_LEDGER_BALANCE', candidateOpeningBalance: 10,
      verifiedQuantity: 8, verificationPending: true, declaredVsVerified: -2,
      recommendedAction: 'CANDIDATE_OPENING_BALANCE',
    });
  });

  it('clasifica ledger sin stock y diferencia negativa', () => {
    const input = baseInput();
    input.movements = [{ id: 'opening', reference: 'OB', kind: 'opening_balance', status: 'completed', destinationLocationId: 'destination' }];
    input.movementItems = [{ id: 'item', movementId: 'opening', lotId: 'lot-a', quantity: 10, unit: 'kg' }];
    const row = verifyLedgerAuthority(input).coordinates[0];
    expect(row).toMatchObject({ classification: 'STOCK_RECORD_MISSING', candidateOpeningBalance: -10, recommendedAction: 'MANUAL_REVIEW' });
  });

  it('distingue zero candidate, ledger excedido y balance negativo', () => {
    const matched = baseInput();
    matched.movements = [{ id: 'opening', reference: 'OB', kind: 'opening_balance', status: 'completed', destinationLocationId: 'destination' }];
    matched.movementItems = [{ id: 'item', movementId: 'opening', lotId: 'lot-a', quantity: 10, unit: 'kg' }];
    matched.stockRecords = [{ id: 'stock', lotId: 'lot-a', locationId: 'destination', unit: 'kg', declaredQuantity: 10, verifiedQuantity: 10, verificationPending: false }];
    expect(verifyLedgerAuthority(matched).coordinates[0]).toMatchObject({ classification: 'MATCH', candidateOpeningBalance: 0 });

    matched.stockRecords[0].declaredQuantity = 8;
    expect(verifyLedgerAuthority(matched).coordinates[0]).toMatchObject({ classification: 'LEDGER_EXCEEDS_STOCK', candidateOpeningBalance: -2 });

    const negative = baseInput();
    negative.movements = [transfer()];
    negative.movementItems = [{ id: 'item', movementId: 'movement-transfer', lotId: 'lot-a', quantity: 3, unit: 'kg' }];
    negative.stockRecords = [{ id: 'stock', lotId: 'lot-a', locationId: 'origin', unit: 'kg', declaredQuantity: 0, verifiedQuantity: 0, verificationPending: false }];
    expect(verifyLedgerAuthority(negative).coordinates.find((row) => row.locationId === 'origin')).toMatchObject({ classification: 'INVALID_NEGATIVE_BALANCE', candidateOpeningBalance: 3 });
  });

  it('detecta unit mismatch, unidades inválidas y duplicados', () => {
    const input = baseInput();
    input.movements = [{ id: 'opening', reference: 'OB', kind: 'opening_balance', status: 'completed', destinationLocationId: 'destination' }];
    input.movementItems = [{ id: 'item', movementId: 'opening', lotId: 'lot-a', quantity: 10, unit: 'bags' }];
    input.stockRecords = [
      { id: 'stock-1', lotId: 'lot-a', locationId: 'destination', unit: 'kg', declaredQuantity: 10, verifiedQuantity: 10, verificationPending: false },
      { id: 'stock-2', lotId: 'lot-a', locationId: 'destination', unit: 'kg', declaredQuantity: 2, verifiedQuantity: 2, verificationPending: false },
      { id: 'stock-invalid', lotId: 'lot-b', locationId: 'origin', unit: 'tons', declaredQuantity: 1, verifiedQuantity: 1, verificationPending: false },
    ];
    const result = verifyLedgerAuthority(input);
    expect(result.coordinates.filter((row) => row.lotId === 'lot-a').every((row) => row.classification === 'UNIT_MISMATCH')).toBe(true);
    expect(result.blockingIssues.map((issue) => issue.code)).toEqual(expect.arrayContaining(['DUPLICATE_STOCK_RECORD', 'INVALID_UNIT']));
    expect(result.ledgerAuthority).toBe(false);
  });

  it('declara autoridad sólo sin bloqueos y con todas las coordenadas MATCH', () => {
    const input = baseInput();
    input.movements = [{ id: 'opening', reference: 'OB', kind: 'opening_balance', status: 'completed', destinationLocationId: 'destination' }];
    input.movementItems = [{ id: 'item', movementId: 'opening', lotId: 'lot-a', quantity: 10, unit: 'kg' }];
    input.stockRecords = [{ id: 'stock', lotId: 'lot-a', locationId: 'destination', unit: 'kg', declaredQuantity: 10, verifiedQuantity: 10, verificationPending: false }];
    expect(verifyLedgerAuthority(input).ledgerAuthority).toBe(true);
  });

  it('no conserva una coordenada fantasma cuando el saldo final es cero y no hay stock_record', () => {
    const input = baseInput();
    input.movements = [
      { id: 'opening', reference: 'OB', kind: 'opening_balance', status: 'completed', destinationLocationId: 'origin' },
      transfer(),
    ];
    input.movementItems = [
      { id: 'opening-item', movementId: 'opening', lotId: 'lot-a', quantity: 10, unit: 'kg' },
      { id: 'transfer-item', movementId: 'movement-transfer', lotId: 'lot-a', quantity: 10, unit: 'kg' },
    ];
    input.stockRecords = [{
      id: 'destination-stock', lotId: 'lot-a', locationId: 'destination', unit: 'kg',
      declaredQuantity: 10, verifiedQuantity: 10, verificationPending: false,
    }];

    const result = verifyLedgerAuthority(input);
    expect(result.coordinates).toEqual([expect.objectContaining({
      locationId: 'destination', ledgerBalance: 10, classification: 'MATCH',
    })]);
    expect(result.ledgerAuthority).toBe(true);
  });

  it('conserva SHOW-* MATCH y balances negativos reales al eliminar sólo net-zero sin stock', () => {
    const input = baseInput();
    input.lots[0].code = 'SHOW-001';
    input.movements = [
      { id: 'opening', reference: 'OB', kind: 'opening_balance', status: 'completed', destinationLocationId: 'origin' },
      transfer(),
      { ...transfer(), id: 'negative-transfer', reference: 'MV-NEG' },
    ];
    input.movementItems = [
      { id: 'opening-item', movementId: 'opening', lotId: 'lot-a', quantity: 10, unit: 'kg' },
      { id: 'show-transfer-item', movementId: 'movement-transfer', lotId: 'lot-a', quantity: 10, unit: 'kg' },
      { id: 'negative-item', movementId: 'negative-transfer', lotId: 'lot-b', quantity: 3, unit: 'kg' },
    ];
    input.stockRecords = [{
      id: 'show-stock', lotId: 'lot-a', locationId: 'destination', unit: 'kg',
      declaredQuantity: 10, verifiedQuantity: 10, verificationPending: false,
    }];

    const result = verifyLedgerAuthority(input);
    expect(result.coordinates.filter((row) => row.lotCode.startsWith('SHOW-'))).toEqual([
      expect.objectContaining({ locationId: 'destination', ledgerBalance: 10, classification: 'MATCH' }),
    ]);
    expect(result.coordinates.find((row) => row.lotId === 'lot-b' && row.locationId === 'origin')).toMatchObject({
      ledgerBalance: -3,
      classification: 'INVALID_NEGATIVE_BALANCE',
    });
    expect(result.ledgerAuthority).toBe(false);
  });
});
