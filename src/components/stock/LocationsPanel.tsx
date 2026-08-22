import { Snowflake, Warehouse } from 'lucide-react';
import { formatKg, formatNumber } from '../../lib/formatters';
import type { Location, Shelf, ShelfUnit, StockView } from '../../types/domain';
import { ShelfGrid } from './ShelfGrid';

export function LocationsPanel({
  locations,
  shelfUnits,
  shelves,
  stockViews,
}: {
  locations: Location[];
  shelfUnits: ShelfUnit[];
  shelves: Shelf[];
  stockViews: StockView[];
}) {
  return (
    <div className="space-y-4">
      {locations.map((location) => {
        const locationUnits = shelfUnits.filter((unit) => unit.locationId === location.id);
        const locationShelves = shelves.filter((shelf) => shelf.locationId === location.id);
        const locationStock = stockViews.filter((record) => record.locationId === location.id);
        const occupied = locationStock.reduce(
          (sum, record) => sum + (record.verificationPending ? record.declaredQuantity : record.verifiedQuantity),
          0,
        );
        const Icon = location.type === 'cold_storage' ? Snowflake : Warehouse;

        return (
          <section key={location.id} className="border border-[#d8dad3] bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-[#e0e2dc] px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center border border-[#d4d8d0] bg-[#f1f4ef] text-[#315d43]">
                  <Icon size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#2d332e]">{location.name}</h2>
                  <p className="mt-0.5 text-[11px] text-[#747970]">
                    {location.type === 'cold_storage' ? 'Cámara frigorífica' : 'Depósito'}
                    {location.temperatureC != null ? ` · ${location.temperatureC} °C` : ''}
                    {' · '}
                    {locationUnits.length} estanterías · {locationShelves.length} estantes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-[13px] font-semibold text-[#284332]">{formatKg(occupied)}</p>
                <p className="mt-0.5 text-[10px] text-[#747970]">
                  {location.capacityKg != null ? `Capacidad ${formatNumber(location.capacityKg)} kg` : 'Sin capacidad definida'}
                </p>
              </div>
            </div>
            <ShelfGrid shelves={locationShelves} shelfUnits={locationUnits} stockViews={locationStock} />
          </section>
        );
      })}
    </div>
  );
}
