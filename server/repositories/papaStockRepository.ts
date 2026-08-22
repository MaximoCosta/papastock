import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { shelves as mockShelves } from '../../src/data/shelves';
import { shelfUnits as mockShelfUnits } from '../../src/data/shelfUnits';
import { transporters as mockTransporters } from '../../src/data/transporters';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { LocationRow, LotRow, MovementRow, StockRecordRow, TraceabilityEventRow } from '../../src/types/database';
import type { Movement, MovementIntent, StockTransferPreview, TraceabilityEvent } from '../../src/types/domain';
import { mapLocation, mapLot, mapMovement, mapStockRecord, mapTraceabilityEvent } from './mappers';
import { buildStockTransferPreview } from '../services/stockTransfer';

export class PapaStockRepository {
  constructor(private readonly database: pg.Pool) {}

  async loadSnapshot(): Promise<PapaStockSnapshot> {
    const [locations, lots, stock, movements, traceability] = await Promise.all([
      this.database.query<LocationRow>('select * from public.locations order by id'),
      this.database.query<LotRow>('select * from public.lots order by code'),
      this.database.query<StockRecordRow>('select * from public.stock_records order by id'),
      this.database.query<MovementRow>('select * from public.movements order by movement_date desc, id'),
      this.database.query<TraceabilityEventRow>('select * from public.traceability_events order by event_date, id'),
    ]);

    if (!locations.rowCount || !lots.rowCount || !stock.rowCount) {
      throw new Error('La base existe pero el seed operativo está incompleto.');
    }

    return {
      locations: locations.rows.map(mapLocation),
      shelfUnits: mockShelfUnits.map((item) => ({ ...item })),
      shelves: mockShelves.map((item) => ({ ...item })),
      lots: lots.rows.map(mapLot),
      stockRecords: stock.rows.map(mapStockRecord),
      movements: movements.rows.map(mapMovement),
      transporters: mockTransporters.map((item) => ({ ...item })),
      traceabilityEvents: traceability.rows.map(mapTraceabilityEvent),
    };
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
      movements: snapshot.movements.filter((item) => item.lotId === lot.id),
      transporters: snapshot.transporters,
      traceabilityEvents: snapshot.traceabilityEvents.filter((item) => item.lotId === lot.id),
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

  async previewStockTransfer(intent: MovementIntent): Promise<StockTransferPreview> {
    return buildStockTransferPreview(intent, await this.loadSnapshot());
  }

  async executeStockTransfer(intent: MovementIntent): Promise<Movement> {
    const client = await this.database.connect();
    try {
      await client.query('begin');
      const [locationsResult, lotResult] = await Promise.all([
        client.query<LocationRow>('select * from public.locations order by id'),
        client.query<LotRow>('select * from public.lots where lower(code) = lower($1) for share', [intent.lotCode]),
      ]);
      const lot = lotResult.rows[0];
      const stockResult = lot
        ? await client.query<StockRecordRow>('select * from public.stock_records where lot_id = $1 order by id for update', [lot.id])
        : { rows: [] as StockRecordRow[] };
      const snapshot: PapaStockSnapshot = {
        locations: locationsResult.rows.map(mapLocation),
        shelfUnits: mockShelfUnits.map((item) => ({ ...item })),
        shelves: mockShelves.map((item) => ({ ...item })),
        lots: lot ? [mapLot(lot)] : [],
        stockRecords: stockResult.rows.map(mapStockRecord),
        movements: [],
        transporters: mockTransporters.map((item) => ({ ...item })),
        traceabilityEvents: [],
      };
      const preview = buildStockTransferPreview(intent, snapshot);
      if (!preview.valid || !preview.lot || !preview.origin || !preview.destination) {
        throw Object.assign(new Error('El movimiento no supera la validación operativa.'), {
          status: 409,
          details: preview.errors,
        });
      }

      const originRecord = stockResult.rows.find((item) => item.location_id === preview.origin!.id);
      if (!originRecord) throw new Error('El stock de origen desapareció durante la transacción.');

      await client.query(
        `update public.stock_records
         set declared_quantity = declared_quantity - $1,
             verified_quantity = verified_quantity - $1,
             updated_at = now()
         where id = $2`,
        [intent.quantityKg, originRecord.id],
      );
      await client.query(
        `insert into public.stock_records
          (id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at)
         values ($1, $2, $3, $4, $4, false, now())
         on conflict (lot_id, location_id) do update set
           declared_quantity = public.stock_records.declared_quantity + excluded.declared_quantity,
           verified_quantity = public.stock_records.verified_quantity + excluded.verified_quantity,
           verification_pending = false,
           updated_at = now()`,
        [`stock-${randomUUID()}`, preview.lot.id, preview.destination.id, intent.quantityKg],
      );

      const token = randomUUID();
      const movementResult = await client.query<MovementRow>(
        `insert into public.movements
          (id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status)
         values ($1, $2, $3, $4, $5, $6, current_date, 'completed')
         returning *`,
        [
          `movement-${token}`,
          `MV-N01-${token.slice(0, 8).toUpperCase()}`,
          preview.lot.id,
          preview.origin.id,
          preview.destination.id,
          intent.quantityKg,
        ],
      );
      await client.query('commit');
      return mapMovement(movementResult.rows[0]);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}
