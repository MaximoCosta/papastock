import { describe, expect, it } from 'vitest';
import { buildDerivedOperationalFacts, type DerivedFactsSource } from './derivedOperationalFacts';
import { verifyLedgerAuthority } from './ledgerVerifier';

const LOTS = [
  { id: 'lot-show-001', code: 'SHOW-001' },
  { id: 'lot-show-002', code: 'SHOW-002' },
];
const LOCATIONS = [
  { id: 'loc-oriente', name: 'Campo Oriente' },
  { id: 'loc-frig-a', name: 'Frigorífico A' },
];

function source(overrides: Partial<DerivedFactsSource> = {}): DerivedFactsSource {
  return {
    lots: [LOTS[0]],
    locations: LOCATIONS,
    stockRecords: [],
    movements: [],
    movementItems: [],
    traceability: [],
    ledgerCoordinates: [],
    ...overrides,
  };
}

const SHOW_001_STOCK: DerivedFactsSource['stockRecords'] = [
  {
    id: 'stock-oriente', lotId: 'lot-show-001', locationId: 'loc-oriente',
    declaredQuantity: 8_000, verifiedQuantity: 7_900, verificationPending: false, unit: 'kg',
  },
  {
    id: 'stock-frig-a', lotId: 'lot-show-001', locationId: 'loc-frig-a',
    declaredQuantity: 2_250, verifiedQuantity: 2_250, verificationPending: false, unit: 'kg',
  },
];

const movement = (over: Partial<DerivedFactsSource['movements'][number]> = {}) => ({
  id: 'mv-1', reference: 'MV-1', kind: 'transfer', status: 'completed', date: '2026-08-20',
  originLocationId: 'loc-oriente', destinationLocationId: 'loc-frig-a', ...over,
});

describe('derived operational facts · stock', () => {
  it('deriva el total y las dos ubicaciones de SHOW-001', () => {
    const facts = buildDerivedOperationalFacts(source({ stockRecords: SHOW_001_STOCK }));
    expect(facts.unitScope).toEqual(['kg']);
    expect(facts.stock).toHaveLength(1);
    expect(facts.stock[0]).toMatchObject({
      lotCode: 'SHOW-001',
      unit: 'kg',
      declared: 10_250,
      verified: 10_150,
      difference: -100,
      hasDiscrepancy: true,
      verificationPendingLocations: 0,
    });
  });

  it('deriva Campo Oriente con -100 y Frigorífico A con 0', () => {
    const [fact] = buildDerivedOperationalFacts(source({ stockRecords: SHOW_001_STOCK })).stock;
    const oriente = fact.locations.find((location) => location.locationId === 'loc-oriente');
    const frigorifico = fact.locations.find((location) => location.locationId === 'loc-frig-a');

    expect(oriente).toMatchObject({
      locationLabel: 'Campo Oriente',
      declared: 8_000, verified: 7_900, difference: -100, hasDiscrepancy: true,
    });
    expect(frigorifico).toMatchObject({
      locationLabel: 'Frigorífico A',
      declared: 2_250, verified: 2_250, difference: 0, hasDiscrepancy: false,
    });
  });

  it('no mezcla kg con bolsas en un mismo hecho', () => {
    const facts = buildDerivedOperationalFacts(source({
      stockRecords: [
        ...SHOW_001_STOCK,
        {
          id: 'stock-bolsas', lotId: 'lot-show-001', locationId: 'loc-oriente',
          declaredQuantity: 30, verifiedQuantity: 28, verificationPending: false, unit: 'bags',
        },
      ],
    }));
    expect(facts.unitScope).toEqual(['bags', 'kg']);
    expect(facts.stock.map((fact) => [fact.unit, fact.declared, fact.difference])).toEqual([
      ['bags', 30, -2],
      ['kg', 10_250, -100],
    ]);
  });
});

describe('derived operational facts · semántica de nulos', () => {
  it('reporta verified=null, no 0, cuando la verificación está pendiente', () => {
    // El registro persiste verifiedQuantity=0 con verificación pendiente: 0 es "sin dato",
    // no "cero kilos". El hecho derivado debe decir desconocido.
    const facts = buildDerivedOperationalFacts(source({
      stockRecords: [{
        id: 'stock-pendiente', lotId: 'lot-show-001', locationId: 'loc-oriente',
        declaredQuantity: 17_000, verifiedQuantity: 0, verificationPending: true, unit: 'kg',
      }],
    }));

    const [fact] = facts.stock;
    expect(fact.declared).toBe(17_000);
    expect(fact.verified).toBeNull();
    expect(fact.difference).toBeNull();
    expect(fact.hasDiscrepancy).toBeNull();
    expect(fact.verificationPendingLocations).toBe(1);
    expect(fact.locations[0]).toMatchObject({ verified: null, difference: null, hasDiscrepancy: null });
  });

  it('vuelve desconocido el total del lote si una sola ubicación está pendiente', () => {
    const facts = buildDerivedOperationalFacts(source({
      stockRecords: [
        SHOW_001_STOCK[0],
        { ...SHOW_001_STOCK[1], verificationPending: true },
      ],
    }));

    const [fact] = facts.stock;
    expect(fact.declared).toBe(10_250);
    expect(fact.verified).toBeNull();
    expect(fact.difference).toBeNull();
    // La ubicación verificada conserva su hecho: sólo el agregado se vuelve desconocido.
    expect(fact.locations.find((location) => location.locationId === 'loc-oriente')).toMatchObject({
      verified: 7_900, difference: -100,
    });
  });
});

describe('derived operational facts · movimientos', () => {
  it('un movimiento de un solo lote no es multi-lote', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement()],
      movementItems: [{ movementId: 'mv-1', lotId: 'lot-show-001', quantity: 2_000, unit: 'kg' }],
    }));
    expect(facts.movements[0]).toMatchObject({
      movementId: 'mv-1', itemCount: 1, lotCount: 1, multipleLots: false,
      lotQuantity: 2_000, movementQuantity: 2_000, unit: 'kg',
    });
  });

  it('un movimiento con dos lotes distintos es multi-lote y separa cantidad del lote y del movimiento', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement({ kind: 'correction' })],
      movementItems: [
        { movementId: 'mv-1', lotId: 'lot-show-001', quantity: 250, unit: 'kg' },
        { movementId: 'mv-1', lotId: 'lot-show-002', quantity: 250, unit: 'kg' },
      ],
    }));
    expect(facts.movements[0]).toMatchObject({
      itemCount: 2, lotCount: 2, multipleLots: true,
      lotQuantity: 250,        // sólo SHOW-001 está en foco
      movementQuantity: 500,   // total del movimiento
    });
  });

  it('dos líneas del MISMO lote no lo convierten en multi-lote', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement()],
      movementItems: [
        { movementId: 'mv-1', lotId: 'lot-show-001', quantity: 600, unit: 'kg' },
        { movementId: 'mv-1', lotId: 'lot-show-001', quantity: 400, unit: 'kg' },
      ],
    }));
    expect(facts.movements[0]).toMatchObject({
      itemCount: 2, lotCount: 1, multipleLots: false, lotQuantity: 1_000, movementQuantity: 1_000,
    });
  });

  it('no inventa una unidad cuando las líneas mezclan unidades', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement()],
      movementItems: [
        { movementId: 'mv-1', lotId: 'lot-show-001', quantity: 10, unit: 'kg' },
        { movementId: 'mv-1', lotId: 'lot-show-001', quantity: 5, unit: 'bags' },
      ],
    }));
    expect(facts.movements[0].unit).toBeNull();
  });

  it('un movimiento sin líneas no reporta cantidad 0 sino desconocida', () => {
    const facts = buildDerivedOperationalFacts(source({ movements: [movement()] }));
    expect(facts.movements[0]).toMatchObject({
      itemCount: 0, lotCount: 0, multipleLots: false,
      lotQuantity: null, movementQuantity: null,
    });
  });
});

describe('derived operational facts · ledger', () => {
  it('MATCH y una diferencia verificada distinta de cero conviven', () => {
    // Reconstruye el saldo declarado desde un movimiento real, como en producción.
    const ledger = verifyLedgerAuthority({
      lots: [LOTS[0]],
      locations: LOCATIONS,
      movements: [{ id: 'mv-open', reference: 'OPEN-1', kind: 'opening_balance', status: 'completed', destinationLocationId: 'loc-oriente' }],
      movementItems: [{ id: 'item-open', movementId: 'mv-open', lotId: 'lot-show-001', quantity: 8_000, unit: 'kg' }],
      stockRecords: [SHOW_001_STOCK[0]],
    });

    const facts = buildDerivedOperationalFacts(source({
      stockRecords: [SHOW_001_STOCK[0]],
      ledgerCoordinates: ledger.coordinates,
    }));

    expect(facts.ledger[0]).toMatchObject({
      status: 'MATCH',
      reconciles: true,        // el ledger reconstruye el DECLARADO
      reconstructed: 8_000,
      declared: 8_000,
      verified: 7_900,
      verifiedDifference: -100, // pero el verificado NO coincide
    });
  });

  it('no cita un recordId para un saldo reconstruido desde varios movimientos', () => {
    const facts = buildDerivedOperationalFacts(source({
      stockRecords: [SHOW_001_STOCK[0]],
      ledgerCoordinates: verifyLedgerAuthority({
        lots: [LOTS[0]], locations: LOCATIONS, movements: [], movementItems: [],
        stockRecords: [SHOW_001_STOCK[0]],
      }).coordinates,
    }));
    expect(facts.ledger[0]).not.toHaveProperty('sources');
  });
});

describe('derived operational facts · temporal', () => {
  it('ubica el movimiento antes de la verificación sin afirmar causalidad', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement({ date: '2026-08-20' })],
      movementItems: [{ movementId: 'mv-1', lotId: 'lot-show-001', quantity: 1_000, unit: 'kg' }],
      traceability: [{
        id: 'trace-verify', lotId: 'lot-show-001', type: 'stock_verification',
        date: '2026-08-21', locationId: 'loc-oriente', data: { verifiedQuantity: 7_900 },
      }],
    }));

    expect(facts.temporal).toEqual([
      { movementId: 'mv-1', eventId: 'trace-verify', relation: 'before' },
    ]);
    // Hechos, no hipótesis: nada que sugiera que el movimiento causó la diferencia.
    expect(JSON.stringify(facts)).not.toMatch(/caus|sospech|probable/i);
  });

  it('no genera relación temporal cuando falta una fecha', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement({ date: null })],
      traceability: [{
        id: 'trace-verify', lotId: 'lot-show-001', type: 'stock_verification',
        date: '2026-08-21', locationId: 'loc-oriente', data: {},
      }],
    }));
    expect(facts.temporal).toEqual([]);
  });

  it('sólo ancla en eventos de verificación, no en cualquier traza', () => {
    const facts = buildDerivedOperationalFacts(source({
      movements: [movement()],
      traceability: [{
        id: 'trace-harvest', lotId: 'lot-show-001', type: 'harvest',
        date: '2026-07-01', locationId: null, data: {},
      }],
    }));
    expect(facts.temporal).toEqual([]);
  });
});

describe('derived operational facts · trazabilidad', () => {
  it('extrae la cantidad verificada del data libre y deja null si no hay ninguna', () => {
    const facts = buildDerivedOperationalFacts(source({
      traceability: [
        {
          id: 'trace-verify', lotId: 'lot-show-001', type: 'stock_verification',
          date: '2026-08-23', locationId: 'loc-oriente', data: { verifiedQuantity: 7_900 },
        },
        {
          id: 'trace-harvest', lotId: 'lot-show-001', type: 'harvest',
          date: '2026-07-20', locationId: null, data: { product: 'Spunta' },
        },
      ],
    }));
    expect(facts.traceability).toEqual([
      { eventId: 'trace-verify', eventType: 'stock_verification', locationId: 'loc-oriente', occurredAt: '2026-08-23', quantity: 7_900, unit: null },
      { eventId: 'trace-harvest', eventType: 'harvest', locationId: null, occurredAt: '2026-07-20', quantity: null, unit: null },
    ]);
  });
});

describe('derived operational facts · pureza', () => {
  it('no muta la entrada', () => {
    const input = source({ stockRecords: SHOW_001_STOCK, movements: [movement()] });
    const snapshot = JSON.stringify(input);
    buildDerivedOperationalFacts(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('es determinístico ante el mismo input', () => {
    const input = source({ stockRecords: SHOW_001_STOCK });
    expect(JSON.stringify(buildDerivedOperationalFacts(input)))
      .toBe(JSON.stringify(buildDerivedOperationalFacts(input)));
  });
});
