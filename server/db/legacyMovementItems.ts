import type pg from 'pg';
import type { MovementItemRow, MovementRow, StockRecordRow } from '../../src/types/database';
import type { QuantityUnit } from '../../src/types/domain';

export interface LegacyMovementMaterialization {
  movementId: string;
  itemId: string;
  lotId: string;
  quantity: number;
  unit: QuantityUnit;
}

export interface UnsupportedLegacyMovement {
  movementId: string;
  reference: string;
  reason: string;
}

export interface LegacyMovementPlan {
  materializable: LegacyMovementMaterialization[];
  blocked: UnsupportedLegacyMovement[];
}

function jsonObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function validUnit(value: unknown): value is QuantityUnit {
  return value === 'kg' || value === 'bags';
}

function inferUnit(movement: MovementRow, stockRecords: StockRecordRow[]): QuantityUnit | undefined {
  const dataUnit = jsonObject(movement.data)?.unit;
  const candidates = new Set<QuantityUnit>();
  if (validUnit(dataUnit)) candidates.add(dataUnit);
  if (validUnit(movement.received_unit)) candidates.add(movement.received_unit);
  for (const stock of stockRecords) {
    if (stock.lot_id === movement.lot_id && validUnit(stock.unit)) candidates.add(stock.unit);
  }
  return candidates.size === 1 ? [...candidates][0] : undefined;
}

export function planLegacyMovementItems(
  movements: MovementRow[],
  existingItems: MovementItemRow[],
  stockRecords: StockRecordRow[],
): LegacyMovementPlan {
  const materializable: LegacyMovementMaterialization[] = [];
  const blocked: UnsupportedLegacyMovement[] = [];
  const itemsByMovement = new Set(existingItems.map((item) => item.movement_id));
  const itemIds = new Map(existingItems.map((item) => [item.id, item.movement_id]));

  for (const movement of movements) {
    if (itemsByMovement.has(movement.id)) continue;
    const reject = (reason: string) => blocked.push({ movementId: movement.id, reference: movement.reference, reason });
    const kind = movement.kind ?? 'transfer';
    if (kind !== 'transfer' && kind !== 'import') {
      reject(`kind ${kind} no admite materialización automática`);
      continue;
    }
    if (!movement.lot_id) {
      reject('lot_id es NULL');
      continue;
    }
    const quantity = movement.quantity == null ? Number.NaN : Number(movement.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      reject('quantity no es positiva');
      continue;
    }
    if ((!movement.origin_location_id && !movement.destination_location_id)
      || (movement.origin_location_id && movement.destination_location_id
        && movement.origin_location_id === movement.destination_location_id)) {
      reject('endpoints ambiguos o inválidos');
      continue;
    }
    const unit = inferUnit(movement, stockRecords);
    if (!unit) {
      reject('unidad no inferible con certeza');
      continue;
    }
    const itemId = `mitem-${movement.id}`;
    const conflictingMovement = itemIds.get(itemId);
    if (conflictingMovement && conflictingMovement !== movement.id) {
      reject(`el id determinístico ${itemId} ya pertenece a otro movimiento`);
      continue;
    }
    materializable.push({ movementId: movement.id, itemId, lotId: movement.lot_id, quantity, unit });
  }

  return { materializable, blocked };
}

/**
 * Herramienta deliberadamente no expuesta como script. El guard de nombre
 * impide usarla contra una base que no esté identificada explícitamente como test.
 */
export async function materializeLegacyMovementItemsInTestDatabase(
  client: pg.PoolClient,
): Promise<LegacyMovementPlan & { inserted: number }> {
  const databaseResult = await client.query<{ current_database: string }>('select current_database()');
  const databaseName = databaseResult.rows[0]?.current_database ?? '';
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('La materialización legacy sólo puede ejecutarse en una base cuyo nombre contenga "test".');
  }

  await client.query('begin');
  try {
    const movements = await client.query<MovementRow>('select * from public.movements order by id for update');
    const items = await client.query<MovementItemRow>('select * from public.movement_items order by movement_id, id');
    const stock = await client.query<StockRecordRow>('select * from public.stock_records order by id');
    const plan = planLegacyMovementItems(movements.rows, items.rows, stock.rows);
    let inserted = 0;
    for (const item of plan.materializable) {
      const result = await client.query(
        `insert into public.movement_items
          (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
         select $1, $2, $3, $4, $5, 0, '{"source":"legacy_materialization"}'::jsonb
         where not exists (
           select 1 from public.movement_items where movement_id = $2
         )
         on conflict (id) do nothing`,
        [item.itemId, item.movementId, item.lotId, item.quantity, item.unit],
      );
      inserted += result.rowCount ?? 0;
    }
    await client.query('commit');
    return { ...plan, inserted };
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}
