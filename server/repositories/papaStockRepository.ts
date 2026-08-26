import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { expandLegacyIntent, movementTouchesLot, recordMatchesUnit } from '../../src/lib/movements';
import { stockUnit } from '../../src/lib/quantity';
import { buildStockVerificationPreview, toStockVerificationConfirmation } from '../../src/lib/stockVerification';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import { getStockViews } from '../../src/services/stockService';
import type {
  DiscrepancyRow,
  LocationRow,
  LotRow,
  MovementItemRow,
  MovementRow,
  ShelfRow,
  ShelfUnitRow,
  StockCountRow,
  StockRecordRow,
  TraceabilityEventRow,
  TransporterRow,
} from '../../src/types/database';
import type {
  Discrepancy,
  LotReallocationInput,
  Movement,
  MovementIntent,
  MovementReceptionInput,
  PlanillaImportResult,
  QuantityUnit,
  Shelf,
  ShelfUnit,
  ShelfUnitInput,
  StockCount,
  StockCountInput,
  StockTransferPreview,
  StockVerificationConfirmation,
  StockVerificationInput,
  TraceabilityEvent,
  Transporter,
  TransporterInput,
} from '../../src/types/domain';
import { buildLotCorrectionPlan } from '../services/lotCorrection';
import { buildReceptionPlan, receptionPayloadFingerprint } from '../services/movementReception';
import { fold, type PlanillaImportPlan } from '../services/planillaImport';
import { buildStockCountPlan } from '../services/stockCount';
import { buildStockTransferPreview } from '../services/stockTransfer';
import {
  mapDiscrepancy,
  mapLocation,
  mapLot,
  mapMovement,
  mapMovementItem,
  mapShelf,
  mapShelfUnit,
  mapStockCount,
  mapStockRecord,
  mapTraceabilityEvent,
  mapTransporter,
} from './mappers';

async function queryCatalogIfPresent<T extends pg.QueryResultRow>(
  client: pg.PoolClient,
  present: string | null | undefined,
  sql: string,
): Promise<T[]> {
  if (!present) return [];
  const result = await client.query<T>(sql);
  return result.rows;
}

function attachMovements(rows: MovementRow[], itemRows: MovementItemRow[]): Movement[] {
  const itemsByMovement = new Map<string, ReturnType<typeof mapMovementItem>[]>();
  for (const row of itemRows) {
    const current = itemsByMovement.get(row.movement_id) ?? [];
    current.push(mapMovementItem(row));
    itemsByMovement.set(row.movement_id, current);
  }
  return rows.map((row) => mapMovement(
    row,
    (itemsByMovement.get(row.id) ?? []).sort((left, right) => left.sortOrder - right.sortOrder),
  ));
}

export class PapaStockRepository {
  constructor(private readonly database: pg.Pool) {}

  async loadSnapshot(): Promise<PapaStockSnapshot> {
    const client = await this.database.connect();
    try {
      await client.query('begin isolation level repeatable read read only');
      const locations = await client.query<LocationRow>('select * from public.locations order by id');
      const lots = await client.query<LotRow>('select * from public.lots order by code');
      const stock = await client.query<StockRecordRow>('select * from public.stock_records order by id');
      const movements = await client.query<MovementRow>('select * from public.movements order by movement_date desc, id');
      const items = await client.query<MovementItemRow>('select * from public.movement_items order by movement_id, sort_order, id');
      const traceability = await client.query<TraceabilityEventRow>('select * from public.traceability_events order by event_date, id');
      const discrepancies = await client.query<DiscrepancyRow>('select * from public.discrepancies order by created_at desc, id');
      const counts = await client.query<StockCountRow>('select * from public.stock_counts order by counted_at desc, id');
      const catalogs = await client.query<{ transporters: string | null; shelf_units: string | null; shelves: string | null }>(
        `select
          to_regclass('public.transporters')::text as transporters,
          to_regclass('public.shelf_units')::text as shelf_units,
          to_regclass('public.shelves')::text as shelves`,
      );
      const catalog = catalogs.rows[0];
      const transporters = await queryCatalogIfPresent<TransporterRow>(
        client,
        catalog?.transporters,
        'select * from public.transporters order by company_name, id',
      );
      const shelfUnits = await queryCatalogIfPresent<ShelfUnitRow>(
        client,
        catalog?.shelf_units,
        'select * from public.shelf_units order by location_id, code',
      );
      const shelves = await queryCatalogIfPresent<ShelfRow>(
        client,
        catalog?.shelves,
        'select * from public.shelves order by location_id, code',
      );

      if (!locations.rowCount || !lots.rowCount || !stock.rowCount) {
        throw new Error('La base existe pero el seed operativo está incompleto.');
      }

      const snapshot = {
        locations: locations.rows.map(mapLocation),
        shelfUnits: shelfUnits.map(mapShelfUnit),
        shelves: shelves.map(mapShelf),
        lots: lots.rows.map(mapLot),
        stockRecords: stock.rows.map(mapStockRecord),
        movements: attachMovements(movements.rows, items.rows),
        transporters: transporters.map(mapTransporter),
        traceabilityEvents: traceability.rows.map(mapTraceabilityEvent),
        discrepancies: discrepancies.rows.map(mapDiscrepancy),
        stockCounts: counts.rows.map(mapStockCount),
      } satisfies PapaStockSnapshot;
      await client.query('commit');
      return snapshot;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async loadLot(idOrCode: string): Promise<PapaStockSnapshot> {
    const snapshot = await this.loadSnapshot();
    const lot = snapshot.lots.find((item) => item.id === idOrCode || item.code.toLowerCase() === idOrCode.toLowerCase());
    if (!lot) throw Object.assign(new Error('Lote no encontrado.'), { status: 404 });
    const lotLocationIds = new Set(
      snapshot.stockRecords.filter((item) => item.lotId === lot.id).map((item) => item.locationId),
    );
    return {
      locations: snapshot.locations,
      shelfUnits: snapshot.shelfUnits.filter((unit) => lotLocationIds.has(unit.locationId)),
      shelves: snapshot.shelves.filter((shelf) => lotLocationIds.has(shelf.locationId)),
      lots: [lot],
      stockRecords: snapshot.stockRecords.filter((item) => item.lotId === lot.id),
      movements: snapshot.movements.filter((item) => movementTouchesLot(item, lot.id)),
      transporters: snapshot.transporters,
      traceabilityEvents: snapshot.traceabilityEvents.filter((item) => item.lotId === lot.id),
      discrepancies: (snapshot.discrepancies ?? []).filter((item) => item.lotId === lot.id),
      stockCounts: (snapshot.stockCounts ?? []).filter((item) => item.lotId === lot.id),
    };
  }

  async insertTraceabilityEvent(event: Omit<TraceabilityEvent, 'id'>): Promise<TraceabilityEvent> {
    const result = await this.database.query<TraceabilityEventRow>(
      `insert into public.traceability_events
        (id, lot_id, event_type, event_date, location_id, data)
       values ($1, $2, $3, $4, $5, $6::jsonb)
       returning *`,
      [`trace-${randomUUID()}`, event.lotId, event.type, event.date, event.locationId ?? null, JSON.stringify(event.data)],
    );
    return mapTraceabilityEvent(result.rows[0]);
  }

  async upsertTransporter(id: string | undefined, input: TransporterInput): Promise<Transporter> {
    const transporterId = id ?? `tr-${randomUUID()}`;
    try {
      const result = await this.database.query<TransporterRow>(
        `insert into public.transporters (
           id, company_name, trade_name, cuit, contact_name, phone, email, address, city, province,
           license_plate, vehicle_type, capacity_kg, insurance_policy, notes, active
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         on conflict (id) do update set
           company_name = excluded.company_name,
           trade_name = excluded.trade_name,
           cuit = excluded.cuit,
           contact_name = excluded.contact_name,
           phone = excluded.phone,
           email = excluded.email,
           address = excluded.address,
           city = excluded.city,
           province = excluded.province,
           license_plate = excluded.license_plate,
           vehicle_type = excluded.vehicle_type,
           capacity_kg = excluded.capacity_kg,
           insurance_policy = excluded.insurance_policy,
           notes = excluded.notes,
           active = excluded.active
         returning *`,
        [
          transporterId,
          input.companyName,
          input.tradeName || null,
          input.cuit,
          input.contactName,
          input.phone,
          input.email,
          input.address,
          input.city,
          input.province,
          input.licensePlate,
          input.vehicleType,
          input.capacityKg,
          input.insurancePolicy || null,
          input.notes || null,
          input.active,
        ],
      );
      const row = result.rows[0];
      if (!row) throw Object.assign(new Error('No se pudo guardar el transportista.'), { status: 500 });
      return mapTransporter(row);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : undefined;
      if (code === '42P01') {
        throw Object.assign(new Error('El esquema de la base no está al día.'), { status: 503, code: '42P01' });
      }
      throw error;
    }
  }

  async insertShelfUnit(input: ShelfUnitInput): Promise<{ unit: ShelfUnit; shelves: Shelf[] }> {
    const location = await this.database.query<LocationRow>('select * from public.locations where id = $1', [input.locationId]);
    if (!location.rowCount) throw Object.assign(new Error('Ubicación no encontrada.'), { status: 404 });
    const levels = Math.max(1, Math.min(6, Math.round(input.levelCount) || 1));
    const unitId = `unit-${randomUUID()}`;
    const code = input.code.trim().toUpperCase();
    const label = input.label.trim() || `Estantería ${code}`;
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const unitResult = await client.query<ShelfUnitRow>(
        `insert into public.shelf_units (id, location_id, code, label, grid_row, grid_col)
         values ($1,$2,$3,$4,$5,$6)
         returning *`,
        [unitId, input.locationId, code, label, input.gridRow, input.gridCol],
      );
      const shelves: Shelf[] = [];
      const capacity = input.capacityKgPerLevel ?? 20000;
      for (let level = 1; level <= levels; level += 1) {
        const shelfResult = await client.query<ShelfRow>(
          `insert into public.shelves (id, location_id, shelf_unit_id, code, label, level, capacity_kg)
           values ($1,$2,$3,$4,$5,$6,$7)
           returning *`,
          [`${unitId}-L${level}`, input.locationId, unitId, `${code}${level}`, `${label} · Nivel ${level}`, level, capacity],
        );
        shelves.push(mapShelf(shelfResult.rows[0]));
      }
      await client.query('commit');
      return { unit: mapShelfUnit(unitResult.rows[0]), shelves };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteShelfUnit(unitId: string): Promise<void> {
    const result = await this.database.query('delete from public.shelf_units where id = $1', [unitId]);
    if (!result.rowCount) throw Object.assign(new Error('Estantería no encontrada.'), { status: 404 });
  }

  async assignStockToShelf(stockRecordId: string, shelfId: string | undefined): Promise<void> {
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const locked = await client.query<StockRecordRow>(
        'select * from public.stock_records where id = $1 for update',
        [stockRecordId],
      );
      const current = locked.rows[0];
      if (!current) throw Object.assign(new Error('Registro de stock no encontrado.'), { status: 404 });
      let locationId = current.location_id;
      if (shelfId) {
        const shelf = await client.query<ShelfRow>('select * from public.shelves where id = $1', [shelfId]);
        if (!shelf.rowCount) throw Object.assign(new Error('Estante no encontrado.'), { status: 404 });
        locationId = shelf.rows[0].location_id;
      }
      await client.query(
        `update public.stock_records
            set shelf_id = $1, location_id = $2, updated_at = now()
          where id = $3`,
        [shelfId ?? null, locationId, stockRecordId],
      );
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async previewStockTransfer(intent: MovementIntent): Promise<StockTransferPreview> {
    return buildStockTransferPreview(intent, await this.loadSnapshot());
  }

  async executeStockTransfer(intent: MovementIntent): Promise<Movement> {
    const expanded = expandLegacyIntent(intent);
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const lotCodes = [...new Set(expanded.items.map((item) => item.lotCode.toLowerCase()))].sort();
      const [locationsResult, lotResult] = await Promise.all([
        client.query<LocationRow>('select * from public.locations order by id'),
        client.query<LotRow>('select * from public.lots where lower(code) = any($1::text[]) order by id for share', [lotCodes]),
      ]);
      const lotIds = lotResult.rows.map((row) => row.id);
      const stockResult = lotIds.length
        ? await client.query<StockRecordRow>('select * from public.stock_records where lot_id = any($1::text[]) order by id for update', [lotIds])
        : { rows: [] as StockRecordRow[] };
      const snapshot: PapaStockSnapshot = {
        locations: locationsResult.rows.map(mapLocation),
        shelfUnits: [],
        shelves: [],
        lots: lotResult.rows.map(mapLot),
        stockRecords: stockResult.rows.map(mapStockRecord),
        movements: [],
        transporters: [],
        traceabilityEvents: [],
      };
      const preview = buildStockTransferPreview(expanded, snapshot);
      if (!preview.valid || !preview.origin || !preview.destination) {
        throw Object.assign(new Error('El movimiento no supera la validación operativa.'), {
          status: 409,
          details: preview.errors,
        });
      }

      for (const line of preview.lines) {
        if (!line.lot) throw new Error('La validación perdió un lote durante la transacción.');
        const originRecord = stockResult.rows.find((item) => (
          item.lot_id === line.lot!.id
          && item.location_id === preview.origin!.id
          && stockUnit(item) === line.unit
        ));
        if (!originRecord) throw new Error('El stock de origen desapareció durante la transacción.');
        await client.query(
          `update public.stock_records
           set declared_quantity = declared_quantity - $1,
               verified_quantity = verified_quantity - $1,
               updated_at = now(),
               version = version + 1
           where id = $2`,
          [line.quantity, originRecord.id],
        );
        await client.query(
          `insert into public.stock_records
            (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit)
           values ($1, $2, $3, $4, $4, false, now(), $5)
           on conflict (lot_id, location_id, unit) do update set
             declared_quantity = public.stock_records.declared_quantity + excluded.declared_quantity,
             verified_quantity = public.stock_records.verified_quantity + excluded.verified_quantity,
             verification_pending = false,
             updated_at = now(),
             version = public.stock_records.version + 1`,
          [`stock-${randomUUID()}`, line.lot.id, preview.destination.id, line.quantity, line.unit],
        );
      }

      const token = randomUUID();
      const units = new Set(preview.lines.map((line) => line.unit));
      const headerQuantity = units.size === 1
        ? preview.lines.reduce((total, line) => total + line.quantity, 0)
        : null;
      const headerLotId = preview.lines.length === 1 ? preview.lines[0]?.lot?.id ?? null : null;
      const movementResult = await client.query<MovementRow>(
        `insert into public.movements
          (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, remito_number, kind, reception_status, data)
         values ($1, $2, $3, $4, $5, $6, current_date, 'completed', $7, 'transfer', 'pending', $8::jsonb)
         returning *`,
        [
          `movement-${token}`,
          `MV-N01-${token.slice(0, 8).toUpperCase()}`,
          headerLotId,
          preview.origin.id,
          preview.destination.id,
          headerQuantity,
          expanded.remitoNumber ?? null,
          JSON.stringify({ source: 'n01' }),
        ],
      );
      const movementId = movementResult.rows[0].id;
      const itemRows: MovementItemRow[] = [];
      for (const [index, line] of preview.lines.entries()) {
        const inserted = await client.query<MovementItemRow>(
          `insert into public.movement_items
            (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
           values ($1, $2, $3, $4, $5, $6)
           returning *`,
          [`mitem-${token}-${index}`, movementId, line.lot!.id, line.quantity, line.unit, index],
        );
        itemRows.push(inserted.rows[0]);
      }
      await client.query('commit');
      return mapMovement(movementResult.rows[0], itemRows.map(mapMovementItem));
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async executePlanillaImport(plan: PlanillaImportPlan): Promise<PlanillaImportResult> {
    if (!plan.preview.valid || plan.movementsToInsert.length === 0) {
      throw Object.assign(new Error('La planilla no tiene movimientos importables.'), { status: 400 });
    }

    const client = await this.database.connect();
    try {
      await client.query('begin');
      const [locationRows, lotRows] = await Promise.all([
        client.query<LocationRow>('select * from public.locations order by id for update'),
        client.query<LotRow>('select * from public.lots order by code for update'),
      ]);

      let createdLocations = 0;
      for (const location of plan.locationsToCreate) {
        if (locationRows.rows.some((row) => fold(row.name) === fold(location.name))) continue;
        await client.query(
          'insert into public.locations (id, name, type) values ($1, $2, $3) on conflict (id) do nothing',
          [location.id, location.name, location.type],
        );
        createdLocations += 1;
      }

      const refreshedLocations = await client.query<LocationRow>('select * from public.locations');
      const locationIdByName = new Map(refreshedLocations.rows.map((row) => [fold(row.name), row.id]));

      let createdLots = 0;
      for (const lot of plan.lotsToCreate) {
        if (lotRows.rows.some((row) => row.code.toLowerCase() === lot.code.toLowerCase())) continue;
        await client.query(
          `insert into public.lots (id, code, variety, campaign, producer, origin, harvest_date)
           values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (code) do nothing`,
          [lot.id, lot.code, lot.variety, lot.campaign, lot.producer, lot.origin, lot.harvestDate ?? null],
        );
        createdLots += 1;
      }

      const refreshedLots = await client.query<LotRow>('select * from public.lots');
      const lotIdByCode = new Map(refreshedLots.rows.map((row) => [row.code.toLowerCase(), row]));

      let createdMovements = 0;
      let skippedMovements = 0;
      const importedLotIds = new Set<string>();

      for (const movement of plan.movementsToInsert) {
        const lot = lotIdByCode.get(movement.lotCode.toLowerCase());
        const originId = locationIdByName.get(fold(movement.originName));
        const destinationId = locationIdByName.get(fold(movement.destinationName));
        if (!lot || !originId || !destinationId || originId === destinationId) {
          skippedMovements += 1;
          continue;
        }
        const inserted = await client.query(
          `insert into public.movements
            (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, data, remito_number, kind, reception_status)
           values ($1, $2, $3, $4, $5, $6, $7, 'completed', $8::jsonb, $9, 'import', 'not_applicable')
           on conflict (reference) do nothing`,
          [
            movement.id,
            movement.reference,
            lot.id,
            originId,
            destinationId,
            movement.quantityKg,
            movement.date,
            JSON.stringify(movement.data),
            typeof movement.data.remito === 'string' ? movement.data.remito : null,
          ],
        );
        if (inserted.rowCount) {
          createdMovements += 1;
          importedLotIds.add(lot.id);
          await client.query(
            `insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
             values ($1, $2, $3, $4, 'kg', 0)
             on conflict (id) do nothing`,
            [`mitem-${movement.id}`, movement.id, lot.id, movement.quantityKg],
          );
        } else {
          skippedMovements += 1;
        }
      }

      for (const code of plan.stockLotCodes) {
        const lot = lotIdByCode.get(code.toLowerCase());
        if (lot) importedLotIds.add(lot.id);
      }

      let upsertedStockRecords = 0;
      for (const lotId of importedLotIds) {
        const lot = refreshedLots.rows.find((row) => row.id === lotId);
        if (!lot) continue;

        const history = await client.query<MovementItemRow & { origin_location_id: string | null; destination_location_id: string | null; status: string }>(
          `select items.*, movements.origin_location_id, movements.destination_location_id, movements.status
           from public.movement_items items
           join public.movements on movements.id = items.movement_id
           where items.lot_id = $1`,
          [lotId],
        );
        const net = new Map<string, number>();
        for (const row of history.rows) {
          if (row.status === 'cancelled') continue;
          const quantity = Number(row.dispatched_quantity);
          const unit = row.unit;
          if (row.origin_location_id) {
            const key = `${row.origin_location_id}:${unit}`;
            net.set(key, (net.get(key) ?? 0) - quantity);
          }
          if (row.destination_location_id) {
            const key = `${row.destination_location_id}:${unit}`;
            net.set(key, (net.get(key) ?? 0) + quantity);
          }
        }

        for (const [composite, rawQuantity] of net) {
          const [locationId, unit] = composite.split(':') as [string, QuantityUnit];
          const quantity = Math.max(0, Math.round(rawQuantity * 1000) / 1000);
          if (quantity <= 0) continue;
          await client.query(
            `insert into public.stock_records
              (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit)
             values ($1, $2, $3, $4, $4, false, now(), $5)
             on conflict (lot_id, location_id, unit) do update set
                declared_quantity = excluded.declared_quantity,
                verified_quantity = excluded.verified_quantity,
                verification_pending = false,
                updated_at = now(),
                version = public.stock_records.version + 1`,
            [`stock-imp-${randomUUID()}`, lotId, locationId, quantity, unit],
          );
          upsertedStockRecords += 1;
        }
      }

      await client.query('commit');
      return { createdLocations, createdLots, createdMovements, skippedMovements, upsertedStockRecords };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async executeStockVerification(input: StockVerificationInput): Promise<StockVerificationConfirmation> {
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const locked = await client.query<StockRecordRow>(
        'select * from public.stock_records where id = $1 for update',
        [input.stockRecordId],
      );
      const current = locked.rows[0];
      if (!current) {
        throw Object.assign(new Error('Registro de stock no encontrado.'), { status: 404 });
      }
      const currentVersion = Number(current.version ?? 0);
      if (currentVersion !== input.expectedVersion) {
        throw Object.assign(new Error('El stock cambió desde el preview. Volvé a validar el conteo.'), { status: 409 });
      }
      const lotResult = await client.query<LotRow>('select * from public.lots where id = $1', [current.lot_id]);
      const locationResult = await client.query<LocationRow>('select * from public.locations where id = $1', [current.location_id]);
      const preview = buildStockVerificationPreview(
        input,
        getStockViews(
          [mapStockRecord(current)],
          lotResult.rows.map(mapLot),
          locationResult.rows.map(mapLocation),
        ),
      );
      if (!preview.valid) {
        throw Object.assign(new Error(preview.issues[0]?.message ?? 'La verificación no es válida.'), { status: 400, details: preview.issues });
      }

      const updated = await client.query<StockRecordRow>(
        `update public.stock_records
            set verified_quantity = $1,
                verification_pending = false,
                updated_at = now(),
                version = version + 1
          where id = $2 and version = $3
          returning *`,
        [input.countedQuantity, input.stockRecordId, input.expectedVersion],
      );
      if (!updated.rowCount) {
        throw Object.assign(new Error('El stock cambió durante la confirmación.'), { status: 409 });
      }
      const inserted = await client.query(
        `insert into public.traceability_events
          (id, lot_id, event_type, event_date, location_id, data)
         values ($1, $2, $3, $4, $5, $6::jsonb)
         on conflict (lot_id, event_type, event_date) do update set
           location_id = excluded.location_id,
           data = excluded.data
         returning *`,
        [
          `trace-${randomUUID()}`,
          preview.lotId,
          'stock_verification',
          input.date,
          preview.locationId || null,
          JSON.stringify({
            verifiedQuantity: input.countedQuantity,
            ...(input.bags ? { bags: input.bags } : {}),
            ...(input.notes ? { notes: input.notes } : {}),
            origin: 'operator_confirmation',
          }),
        ],
      );
      await client.query('commit');
      return toStockVerificationConfirmation(preview, true, inserted.rows[0]?.id, Number(updated.rows[0].version));
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async executeReception(input: MovementReceptionInput): Promise<{ movement: Movement; discrepancies: Discrepancy[] }> {
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const movementResult = await client.query<MovementRow>('select * from public.movements where id = $1 for update', [input.movementId]);
      const movementRow = movementResult.rows[0];
      if (!movementRow) throw Object.assign(new Error('Movimiento no encontrado.'), { status: 404 });
      const itemResult = await client.query<MovementItemRow>(
        'select * from public.movement_items where movement_id = $1 order by sort_order for update',
        [input.movementId],
      );
      const movement = mapMovement(movementRow, itemResult.rows.map(mapMovementItem));
      const fingerprint = receptionPayloadFingerprint(input);
      if (movement.receptionStatus !== 'pending') {
        if (
          movementRow.reception_idempotency_key === input.idempotencyKey
          && movementRow.reception_payload_fingerprint === fingerprint
        ) {
          const existingDiscrepancies = await client.query<DiscrepancyRow>(
            'select * from public.discrepancies where movement_id = $1 order by created_at, id',
            [movement.id],
          );
          await client.query('commit');
          return {
            movement,
            discrepancies: existingDiscrepancies.rows.map(mapDiscrepancy),
          };
        }
        throw Object.assign(new Error('El movimiento ya tiene una recepción registrada.'), { status: 409 });
      }
      if (movementRow.reception_idempotency_key) {
        throw Object.assign(new Error('La recepción tiene una clave idempotente inconsistente.'), { status: 409 });
      }
      const plan = buildReceptionPlan(movement, input);
      if (!plan.valid) {
        throw Object.assign(new Error(plan.errors[0]?.message ?? 'La recepción no es válida.'), { status: 409, details: plan.errors });
      }

      await client.query(
        `update public.movements
            set reception_idempotency_key = $1,
                reception_payload_fingerprint = $2
          where id = $3`,
        [input.idempotencyKey, fingerprint, movement.id],
      );

      if (movement.destinationLocationId) {
        const lotIds = [...new Set(plan.stockAdjustments.map((item) => item.lotId))].sort();
        if (lotIds.length) {
          await client.query(
            'select id from public.stock_records where lot_id = any($1::text[]) and location_id = $2 order by id for update',
            [lotIds, movement.destinationLocationId],
          );
        }
      }

      for (const update of plan.itemUpdates) {
        await client.query(
          `update public.movement_items
              set received_quantity = $1, received_at = $2
            where id = $3`,
          [update.receivedQuantity, `${input.date}T12:00:00Z`, update.item.id],
        );
      }
      for (const adjustment of plan.stockAdjustments) {
        await client.query(
          `update public.stock_records
              set verified_quantity = verified_quantity + $1, updated_at = now(), version = version + 1
            where lot_id = $2 and location_id = $3 and unit = $4`,
          [adjustment.deltaVerified, adjustment.lotId, movement.destinationLocationId, adjustment.unit],
        );
      }

      const created: Discrepancy[] = [];
      for (const discrepancy of plan.discrepancies) {
        const inserted = await client.query<DiscrepancyRow>(
          `insert into public.discrepancies
            (id, movement_id, movement_item_id, lot_id, location_id, type, expected_quantity, observed_quantity, unit, difference, status, cause)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open', $11)
           returning *`,
          [
            `disc-${randomUUID()}`,
            discrepancy.movementId ?? null,
            discrepancy.movementItemId ?? null,
            discrepancy.lotId ?? null,
            discrepancy.locationId ?? null,
            discrepancy.type,
            discrepancy.expectedQuantity,
            discrepancy.observedQuantity,
            discrepancy.unit,
            discrepancy.difference,
            discrepancy.cause ?? null,
          ],
        );
        created.push(mapDiscrepancy(inserted.rows[0]));
        if (discrepancy.lotId) {
          await client.query(
            `insert into public.traceability_events
              (id, lot_id, event_type, event_date, location_id, data)
             values ($1, $2, 'reception', $3, $4, $5::jsonb)`,
            [
              `trace-${randomUUID()}`,
              discrepancy.lotId,
              input.date,
              movement.destinationLocationId ?? null,
              JSON.stringify({
                remitoNumber: movement.remitoNumber,
                reference: movement.reference,
                expectedQuantity: discrepancy.expectedQuantity,
                observedQuantity: discrepancy.observedQuantity,
                difference: discrepancy.difference,
                unit: discrepancy.unit,
              }),
            ],
          );
        }
      }

      await client.query(
        `update public.movements
            set reception_status = $1, received_total = $2, received_unit = $3, received_at = $4
          where id = $5`,
        [plan.receptionStatus, plan.receivedTotal ?? null, plan.receivedUnit ?? null, `${input.date}T12:00:00Z`, movement.id],
      );

      const refreshed = await client.query<MovementRow>('select * from public.movements where id = $1', [movement.id]);
      const refreshedItems = await client.query<MovementItemRow>('select * from public.movement_items where movement_id = $1 order by sort_order', [movement.id]);
      await client.query('commit');
      return { movement: mapMovement(refreshed.rows[0], refreshedItems.rows.map(mapMovementItem)), discrepancies: created };
    } catch (error) {
      await client.query('rollback');
      if (
        typeof error === 'object'
        && error !== null
        && 'constraint' in error
        && error.constraint === 'movements_reception_idempotency_key_unique'
      ) {
        throw Object.assign(new Error('La clave idempotente ya fue utilizada para otra recepción.'), { status: 409 });
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async executeLotCorrection(input: LotReallocationInput): Promise<Movement> {
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const originalResult = await client.query<MovementRow>('select * from public.movements where id = $1 for update', [input.originalMovementId]);
      if (!originalResult.rows[0]) throw Object.assign(new Error('Movimiento original no encontrado.'), { status: 404 });
      const itemResult = await client.query<MovementItemRow>('select * from public.movement_items where movement_id = $1', [input.originalMovementId]);
      const original = mapMovement(originalResult.rows[0], itemResult.rows.map(mapMovementItem));
      const [lots, stock] = await Promise.all([
        client.query<LotRow>('select * from public.lots order by id for share'),
        client.query<StockRecordRow>('select * from public.stock_records where location_id = $1 order by id for update', [input.locationId]),
      ]);
      const plan = buildLotCorrectionPlan(input, original, lots.rows.map(mapLot), stock.rows.map(mapStockRecord));
      if (!plan.valid || !plan.fromLot || !plan.toLot) {
        throw Object.assign(new Error(plan.errors[0]?.message ?? 'La corrección no es válida.'), { status: 409, details: plan.errors });
      }

      await client.query(
        `insert into public.stock_records
          (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit)
         values ($1, $2, $3, $4, $4, false, now(), $5)
         on conflict (lot_id, location_id, unit) do update set
           declared_quantity = stock_records.declared_quantity + excluded.declared_quantity,
           verified_quantity = stock_records.verified_quantity + excluded.verified_quantity,
           updated_at = now(),
           version = stock_records.version + 1`,
        [`stock-cor-${randomUUID()}`, plan.fromLot.id, plan.locationId, plan.quantity, plan.unit],
      );
      const deducted = await client.query(
        `update public.stock_records
            set declared_quantity = declared_quantity - $1,
                verified_quantity = verified_quantity - $1,
                updated_at = now(),
                version = version + 1
          where lot_id = $2 and location_id = $3 and unit = $4`,
        [plan.quantity, plan.toLot.id, plan.locationId, plan.unit],
      );
      if (deducted.rowCount !== 1) {
        throw Object.assign(new Error('El stock a corregir cambió antes de confirmar.'), { status: 409 });
      }

      const token = randomUUID();
      const movementResult = await client.query<MovementRow>(
        `insert into public.movements
          (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status, remito_number, kind, corrects_movement_id, reception_status, data)
         values ($1, $2, null, $3, $3, $4, current_date, 'completed', $5, 'correction', $6, 'not_applicable', $7::jsonb)
         returning *`,
        [
          `movement-${token}`,
          `MV-COR-${token.slice(0, 8).toUpperCase()}`,
          plan.locationId,
          plan.quantity,
          original.remitoNumber ?? null,
          original.id,
          JSON.stringify({
            source: 'correction',
            fromLotCode: plan.fromLot.code,
            toLotCode: plan.toLot.code,
          }),
        ],
      );
      const items = [
        await client.query<MovementItemRow>(
          `insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
           values ($1, $2, $3, $4, $5, 0, '{"effect":"restore"}'::jsonb) returning *`,
          [`mitem-${token}-0`, movementResult.rows[0].id, plan.fromLot.id, plan.quantity, plan.unit],
        ),
        await client.query<MovementItemRow>(
          `insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data)
           values ($1, $2, $3, $4, $5, 1, '{"effect":"deduct"}'::jsonb) returning *`,
          [`mitem-${token}-1`, movementResult.rows[0].id, plan.toLot.id, plan.quantity, plan.unit],
        ),
      ];
      for (const lot of [plan.fromLot, plan.toLot]) {
        await client.query(
          `insert into public.traceability_events (id, lot_id, event_type, event_date, location_id, data)
           values ($1, $2, 'correction', current_date, $3, $4::jsonb)`,
          [
            `trace-${randomUUID()}`,
            lot.id,
            plan.locationId,
            JSON.stringify({
              reference: movementResult.rows[0].reference,
              corrects: original.reference,
              remitoNumber: original.remitoNumber,
              quantity: plan.quantity,
              unit: plan.unit,
              fromLotCode: plan.fromLot.code,
              toLotCode: plan.toLot.code,
            }),
          ],
        );
      }
      await client.query('commit');
      return mapMovement(movementResult.rows[0], items.flatMap((result) => result.rows.map(mapMovementItem)));
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async executeStockCount(input: StockCountInput): Promise<{ count: StockCount; discrepancy?: Discrepancy }> {
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const [locations, lots, stock] = await Promise.all([
        client.query<LocationRow>('select * from public.locations order by id'),
        client.query<LotRow>('select * from public.lots order by id for share'),
        client.query<StockRecordRow>('select * from public.stock_records order by id for update'),
      ]);
      const plan = buildStockCountPlan(input, lots.rows.map(mapLot), locations.rows.map(mapLocation), stock.rows.map(mapStockRecord));
      if (!plan.valid || !plan.record || !plan.lot || !plan.location) {
        throw Object.assign(new Error(plan.errors[0]?.message ?? 'El conteo no es válido.'), { status: 409, details: plan.errors });
      }

      await client.query(
        `update public.stock_records
            set verified_quantity = $1, verification_pending = false, updated_at = now(), version = version + 1
          where id = $2`,
        [input.observedQuantity, plan.record.id],
      );

      let discrepancy: Discrepancy | undefined;
      if (plan.difference !== 0) {
        const inserted = await client.query<DiscrepancyRow>(
          `insert into public.discrepancies
            (id, stock_record_id, lot_id, location_id, type, expected_quantity, observed_quantity, unit, difference, status)
           values ($1, $2, $3, $4, 'physical_count', $5, $6, $7, $8, 'open')
           returning *`,
          [
            `disc-${randomUUID()}`,
            plan.record.id,
            plan.lot.id,
            plan.location.id,
            plan.expectedQuantity,
            plan.observedQuantity,
            input.unit,
            plan.difference,
          ],
        );
        discrepancy = mapDiscrepancy(inserted.rows[0]);
      }

      const countResult = await client.query<StockCountRow>(
        `insert into public.stock_counts
          (id, location_id, lot_id, expected_quantity, observed_quantity, unit, counted_at, notes, discrepancy_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning *`,
        [
          `count-${randomUUID()}`,
          plan.location.id,
          plan.lot.id,
          plan.expectedQuantity,
          plan.observedQuantity,
          input.unit,
          input.date,
          input.notes ?? null,
          discrepancy?.id ?? null,
        ],
      );
      await client.query(
        `insert into public.traceability_events
          (id, lot_id, event_type, event_date, location_id, data)
         values ($1, $2, 'physical_count', $3, $4, $5::jsonb)`,
        [
          `trace-${randomUUID()}`,
          plan.lot.id,
          input.date,
          plan.location.id,
          JSON.stringify({
            expectedQuantity: plan.expectedQuantity,
            observedQuantity: plan.observedQuantity,
            difference: plan.difference,
            unit: input.unit,
            notes: input.notes,
          }),
        ],
      );
      await client.query('commit');
      return { count: mapStockCount(countResult.rows[0]), discrepancy };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}
