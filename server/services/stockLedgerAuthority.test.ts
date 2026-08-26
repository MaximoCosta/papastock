import { describe, expect, it } from 'vitest';
import { locations } from '../../src/data/locations';
import { lots } from '../../src/data/lots';
import { movements } from '../../src/data/movements';
import { stockRecords } from '../../src/data/stock';
import { movementItemsOf } from '../../src/lib/movements';
import { stockUnit } from '../../src/lib/quantity';
import { verifyLedgerAuthority } from './ledgerVerifier';

function fixtureAudit() {
  return verifyLedgerAuthority({
    lots: lots.map(({ id, code }) => ({ id, code })),
    locations: locations.map(({ id, name }) => ({ id, name })),
    movements: movements.map((movement) => ({
      id: movement.id,
      reference: movement.reference,
      kind: movement.kind ?? 'transfer',
      status: movement.status,
      lotId: movement.lotId,
      quantity: movement.quantity,
      originLocationId: movement.originLocationId,
      destinationLocationId: movement.destinationLocationId,
      correctsMovementId: movement.correctsMovementId,
    })),
    movementItems: movements.flatMap((movement) => movementItemsOf(movement).map((item) => ({
      id: item.id,
      movementId: movement.id,
      lotId: item.lotId,
      quantity: item.dispatchedQuantity,
      unit: item.unit,
    }))),
    stockRecords: stockRecords.map((stock) => ({
      id: stock.id,
      lotId: stock.lotId,
      locationId: stock.locationId,
      unit: stockUnit(stock),
      declaredQuantity: stock.declaredQuantity,
      verifiedQuantity: stock.verifiedQuantity,
      verificationPending: Boolean(stock.verificationPending),
    })),
  });
}

describe('auditoría de autoridad del ledger para H4', () => {
  it('demuestra que A-204 requiere revisión y no fuerza autoridad', () => {
    const audit = fixtureAudit();
    expect(audit.coordinates.find((row) => row.lotCode === 'A-204' && row.locationId === 'loc-south')).toMatchObject({
      persistedBalance: 25000,
      ledgerBalance: 9000,
      candidateOpeningBalance: 16000,
      classification: 'MISSING_LEDGER_BALANCE',
    });
    expect(audit.ledgerAuthority).toBe(false);
  });

  it('demuestra saldos sin eventos de apertura', () => {
    const audit = fixtureAudit();
    expect(audit.coordinates.find((row) => row.lotCode === 'B-221' && row.locationId === 'loc-south')).toMatchObject({ candidateOpeningBalance: 15200 });
    expect(audit.coordinates.find((row) => row.lotCode === '300')).toMatchObject({ candidateOpeningBalance: 500, unit: 'bags' });
  });

  it('expone el origen negativo de A-310 aunque el destino sea MATCH', () => {
    const audit = fixtureAudit();
    expect(audit.coordinates.find((row) => row.lotCode === 'A-310' && row.locationId === 'loc-central')).toMatchObject({ classification: 'MATCH' });
    expect(audit.coordinates.find((row) => row.lotCode === 'A-310' && row.locationId === 'loc-warehouse')).toMatchObject({
      ledgerBalance: -22000,
      classification: 'INVALID_NEGATIVE_BALANCE',
    });
  });
});
