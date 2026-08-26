import { Grid3x3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { formatKg } from '../../lib/formatters';
import type { AddShelfUnitInput } from '../../state/AppDataContext';
import type { Location, Shelf, ShelfUnit, StockView } from '../../types/domain';
import { Button } from '../common/Button';

const GRID_ROWS = 4;
const GRID_COLS = 5;

function occupiedKg(record: StockView): number {
  return record.verificationPending ? record.declaredQuantity : record.verifiedQuantity;
}

export function WarehouseModelPanel({
  locations,
  shelfUnits,
  shelves,
  stockViews,
  onAddUnit,
  onRemoveUnit,
  onAssignStock,
}: {
  locations: Location[];
  shelfUnits: ShelfUnit[];
  shelves: Shelf[];
  stockViews: StockView[];
  onAddUnit: (input: AddShelfUnitInput) => void | Promise<unknown>;
  onRemoveUnit: (unitId: string) => void | Promise<unknown>;
  onAssignStock: (stockRecordId: string, shelfId: string | undefined) => void | Promise<unknown>;
}) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const [selectedUnitId, setSelectedUnitId] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [pendingCell, setPendingCell] = useState<{ row: number; col: number }>();
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [levelCount, setLevelCount] = useState('3');

  const location = locations.find((item) => item.id === locationId) ?? locations[0];
  const unitsHere = useMemo(
    () => shelfUnits.filter((unit) => unit.locationId === locationId),
    [locationId, shelfUnits],
  );
  const unitAt = useMemo(() => {
    const map = new Map<string, ShelfUnit>();
    for (const unit of unitsHere) map.set(`${unit.gridRow}:${unit.gridCol}`, unit);
    return map;
  }, [unitsHere]);

  const selectedUnit = unitsHere.find((unit) => unit.id === selectedUnitId);
  const unitLevels = useMemo(
    () => shelves
      .filter((shelf) => shelf.shelfUnitId === selectedUnitId)
      .sort((a, b) => b.level - a.level),
    [selectedUnitId, shelves],
  );

  const unassigned = useMemo(
    () => stockViews.filter((record) => record.locationId === locationId && !record.shelfId),
    [locationId, stockViews],
  );

  function openPlace(row: number, col: number) {
    if (unitAt.has(`${row}:${col}`)) return;
    setPendingCell({ row, col });
    setPlacing(true);
    setCode('');
    setLabel('');
    setLevelCount('3');
  }

  function submitPlace(event: FormEvent) {
    event.preventDefault();
    if (!pendingCell || !code.trim()) return;
    onAddUnit({
      locationId,
      code: code.trim(),
      label: label.trim() || `Estantería ${code.trim().toUpperCase()}`,
      gridRow: pendingCell.row,
      gridCol: pendingCell.col,
      levelCount: Number(levelCount) || 3,
    });
    setPlacing(false);
    setPendingCell(undefined);
  }

  function selectUnit(unit: ShelfUnit) {
    setSelectedUnitId(unit.id);
    setPlacing(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border border-[#d8dad3] bg-white p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777c74]">Modelo de depósito</p>
          <h2 className="mt-1 text-sm font-semibold text-[#2d332e]">Plano · estanterías · estantes</h2>
          <p className="mt-1 text-[11px] text-[#747970]">
            Hacé clic en una celda vacía para colocar una estantería, o en una existente para asignar lotes a cada estante.
          </p>
        </div>
        <label className="min-w-[220px]">
          <span className="label">Ubicación</span>
          <select
            className="field mt-1 min-h-10 text-[12px]"
            value={locationId}
            onChange={(event) => {
              setLocationId(event.target.value);
              setSelectedUnitId(undefined);
              setPlacing(false);
            }}
          >
            {locations.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-[1.35fr_0.95fr] gap-4 max-[1100px]:grid-cols-1">
        <section className="border border-[#d8dad3] bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[#6b7169]">
            <Grid3x3 size={14} />
            <span>{location?.name ?? 'Ubicación'} · {GRID_ROWS}×{GRID_COLS} · {unitsHere.length} estanterías</span>
          </div>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
            role="grid"
            aria-label={`Plano de ${location?.name ?? 'depósito'}`}
          >
            {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => {
              const row = Math.floor(index / GRID_COLS);
              const col = index % GRID_COLS;
              const unit = unitAt.get(`${row}:${col}`);
              const levels = unit ? shelves.filter((shelf) => shelf.shelfUnitId === unit.id) : [];
              const stockOnUnit = unit
                ? stockViews.filter((record) => levels.some((shelf) => shelf.id === record.shelfId))
                : [];
              const occupied = stockOnUnit.reduce((sum, record) => sum + occupiedKg(record), 0);
              const isSelected = unit?.id === selectedUnitId;

              if (unit) {
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onClick={() => selectUnit(unit)}
                    className={`min-h-[88px] border p-2 text-left transition-colors ${
                      isSelected
                        ? 'border-[#234b37] bg-[#e7eee8]'
                        : 'border-[#c3c7be] bg-[#f4f5f1] hover:border-[#234b37]'
                    }`}
                  >
                    <p className="text-[12px] font-bold tabular text-[#284332]">{unit.code}</p>
                    <p className="mt-0.5 truncate text-[9px] text-[#6b7169]">{unit.label}</p>
                    <p className="mt-2 text-[10px] tabular text-[#5f645d]">
                      {levels.length} est. · {formatKg(occupied)}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#7a7f77]">
                      {stockOnUnit.length} lote{stockOnUnit.length === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              }

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onClick={() => openPlace(row, col)}
                  className="min-h-[88px] border border-dashed border-[#cfd2ca] bg-[#fafaf7] text-[10px] font-semibold text-[#8a8f86] hover:border-[#234b37] hover:bg-[#eef2eb] hover:text-[#315d43]"
                >
                  <Plus size={14} className="mx-auto mb-1" />
                  Colocar
                </button>
              );
            })}
          </div>
        </section>

        <aside className="border border-[#d8dad3] bg-white p-4">
          {placing && pendingCell ? (
            <form onSubmit={submitPlace} className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777c74]">Nueva estantería</p>
                <p className="mt-1 text-[12px] text-[#5f645d]">
                  Celda R{pendingCell.row + 1} · C{pendingCell.col + 1}
                </p>
              </div>
              <label>
                <span className="label">Código</span>
                <input className="field mt-1 min-h-10 text-[12px]" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej. G-D" required />
              </label>
              <label>
                <span className="label">Etiqueta</span>
                <input className="field mt-1 min-h-10 text-[12px]" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Fila D · entrada" />
              </label>
              <label>
                <span className="label">Cantidad de estantes (niveles)</span>
                <input
                  className="field mt-1 min-h-10 text-[12px]"
                  type="number"
                  min={1}
                  max={6}
                  value={levelCount}
                  onChange={(e) => setLevelCount(e.target.value)}
                />
              </label>
              <div className="flex gap-2 pt-1">
                <Button type="submit"><Plus size={14} /> Crear</Button>
                <Button type="button" variant="ghost" onClick={() => { setPlacing(false); setPendingCell(undefined); }}>Cancelar</Button>
              </div>
            </form>
          ) : selectedUnit ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#777c74]">Estantería</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#2d332e]">{selectedUnit.code}</h3>
                  <p className="mt-0.5 text-[11px] text-[#747970]">{selectedUnit.label}</p>
                </div>
                <Button
                  variant="danger"
                  className="min-h-9 px-3"
                  onClick={() => {
                    onRemoveUnit(selectedUnit.id);
                    setSelectedUnitId(undefined);
                  }}
                >
                  <Trash2 size={13} />
                </Button>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7169]">Estantes (arriba → abajo)</p>
                <div className="space-y-2">
                  {unitLevels.map((shelf) => {
                    const lots = stockViews.filter((record) => record.shelfId === shelf.id);
                    const occupied = lots.reduce((sum, record) => sum + occupiedKg(record), 0);
                    return (
                      <div key={shelf.id} className="border border-[#dde0d8] bg-[#fafaf7] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[12px] font-bold tabular text-[#284332]">{shelf.code}</p>
                            <p className="text-[10px] text-[#747970]">Nivel {shelf.level} · {formatKg(occupied)}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-[#5f645d]">{lots.length} lote{lots.length === 1 ? '' : 's'}</span>
                        </div>

                        {lots.length > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-[#e4e6e0] pt-2">
                            {lots.map((record) => (
                              <li key={record.id} className="flex items-center justify-between gap-2 text-[11px]">
                                <span>
                                  <span className="font-semibold">{record.lot.code}</span>
                                  {' · '}
                                  {formatKg(occupiedKg(record))}
                                </span>
                                <button
                                  type="button"
                                  className="text-[10px] font-bold text-[#a33e37] hover:underline"
                                  onClick={() => onAssignStock(record.id, undefined)}
                                >
                                  Quitar
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <label className="mt-2 block">
                          <span className="sr-only">Asignar lote a {shelf.code}</span>
                          <select
                            className="field min-h-9 text-[11px]"
                            defaultValue=""
                            onChange={(event) => {
                              const stockId = event.target.value;
                              if (!stockId) return;
                              onAssignStock(stockId, shelf.id);
                              event.target.value = '';
                            }}
                          >
                            <option value="">Asignar lote…</option>
                            {stockViews
                              .filter((record) => record.locationId === locationId && record.shelfId !== shelf.id)
                              .map((record) => (
                                <option key={record.id} value={record.id}>
                                  {record.lot.code}
                                  {record.shelfId ? ' (mover)' : ' (sin estante)'}
                                </option>
                              ))}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {unassigned.length > 0 && (
                <p className="text-[10px] text-[#8a6a2b]">
                  {unassigned.length} lote{unassigned.length === 1 ? '' : 's'} en esta ubicación sin estante asignado.
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-4 text-center">
              <Grid3x3 size={22} className="text-[#9aa194]" />
              <p className="text-[12px] font-semibold text-[#50564f]">Seleccioná o colocá una estantería</p>
              <p className="text-[11px] leading-5 text-[#747970]">
                El plano representa la planta del depósito. Cada estantería tiene varios estantes (niveles) para el control de stock.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
