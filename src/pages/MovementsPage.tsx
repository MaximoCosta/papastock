import { Route } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { MovementReceptionForm } from '../components/stock/MovementReceptionForm';
import { MovementsPanel } from '../components/stock/MovementsPanel';
import { useAppData } from '../state/AppDataContext';

export function MovementsPage() {
  const { movements, locations, lots, transporters, addMovement, dataSource, refreshData } = useAppData();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return movements;
    return movements.filter((movement) => (
      movement.reference.toLowerCase().includes(needle)
      || (movement.remitoNumber ?? '').toLowerCase().includes(needle)
    ));
  }, [movements, query]);

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Movimientos"
        description="Un remito puede tener varias líneas de lote. Buscá por referencia interna o número de remito."
        actions={(
          <Link to="/movements/new">
            <Button><Route size={14} /> Mover stock</Button>
          </Link>
        )}
      />
      <label className="mb-3 block">
        <span className="sr-only">Buscar remito</span>
        <input
          className="field min-h-10 max-w-sm text-[12px]"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por remito o referencia…"
        />
      </label>
      <MovementReceptionForm
        movements={filtered}
        enabled={dataSource === 'database'}
        onReceived={refreshData}
      />
      <MovementsPanel
        movements={filtered}
        locations={locations}
        lots={lots}
        transporters={transporters}
        onAdd={addMovement}
      />
    </>
  );
}
