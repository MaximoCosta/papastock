import type pg from 'pg';
import { verifyLedgerAuthority, type LedgerVerificationResult, type LedgerVerifierInput } from '../services/ledgerVerifier';

type QueryClient = Pick<pg.PoolClient, 'query'>;

export async function loadLedgerVerifierInput(client: QueryClient): Promise<LedgerVerifierInput> {
  const lots = await client.query<{ id: string; code: string }>('select id, code from public.lots order by id');
  const locations = await client.query<{ id: string; name: string }>('select id, name from public.locations order by id');
  const movements = await client.query<{
    id: string; reference: string; kind: string; status: string; lot_id: string | null;
    quantity: string | number | null; origin_location_id: string | null; destination_location_id: string | null;
    corrects_movement_id: string | null;
  }>(`select id, reference, kind, status, lot_id, quantity,
            origin_location_id, destination_location_id, corrects_movement_id
       from public.movements order by id`);
  const items = await client.query<{
    id: string; movement_id: string; lot_id: string; dispatched_quantity: string | number;
    unit: string; data: unknown;
  }>(`select id, movement_id, lot_id, dispatched_quantity, unit, data
       from public.movement_items order by movement_id, sort_order, id`);
  const stock = await client.query<{
    id: string; lot_id: string; location_id: string; unit: string;
    declared_quantity: string | number; verified_quantity: string | number; verification_pending: boolean;
  }>(`select id, lot_id, location_id, unit, declared_quantity, verified_quantity, verification_pending
       from public.stock_records order by id`);

  return {
    lots: lots.rows,
    locations: locations.rows,
    movements: movements.rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      kind: row.kind,
      status: row.status,
      lotId: row.lot_id ?? undefined,
      quantity: row.quantity == null ? undefined : Number(row.quantity),
      originLocationId: row.origin_location_id ?? undefined,
      destinationLocationId: row.destination_location_id ?? undefined,
      correctsMovementId: row.corrects_movement_id ?? undefined,
    })),
    movementItems: items.rows.map((row) => ({
      id: row.id,
      movementId: row.movement_id,
      lotId: row.lot_id,
      quantity: Number(row.dispatched_quantity),
      unit: row.unit,
      data: row.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? row.data as Record<string, unknown>
        : undefined,
    })),
    stockRecords: stock.rows.map((row) => ({
      id: row.id,
      lotId: row.lot_id,
      locationId: row.location_id,
      unit: row.unit,
      declaredQuantity: Number(row.declared_quantity),
      verifiedQuantity: Number(row.verified_quantity),
      verificationPending: row.verification_pending,
    })),
  };
}

export async function verifyLedgerWithClient(client: QueryClient): Promise<LedgerVerificationResult> {
  return verifyLedgerAuthority(await loadLedgerVerifierInput(client));
}

export async function verifyLedgerReadOnly(database: pg.Pool): Promise<LedgerVerificationResult> {
  const client = await database.connect();
  try {
    await client.query('begin transaction isolation level repeatable read read only');
    await client.query("set local statement_timeout = '10s'");
    const result = await verifyLedgerWithClient(client);
    await client.query('rollback');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
