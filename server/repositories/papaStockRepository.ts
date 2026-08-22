import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { shelves as mockShelves } from '../../src/data/shelves';
import { shelfUnits as mockShelfUnits } from '../../src/data/shelfUnits';
import { transporters as mockTransporters } from '../../src/data/transporters';
import type { PapaStockSnapshot } from '../../src/repositories/dataRepository';
import type { LocationRow, LotRow, MovementRow, StockRecordRow, TraceabilityEventRow } from '../../src/types/database';
import type { TraceabilityEvent } from '../../src/types/domain';
import { mapLocation, mapLot, mapMovement, mapStockRecord, mapTraceabilityEvent } from './mappers';

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
}
