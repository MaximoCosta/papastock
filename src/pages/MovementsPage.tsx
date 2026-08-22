import { Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { MovementsPanel } from '../components/stock/MovementsPanel';
import { useAppData } from '../state/AppDataContext';

export function MovementsPage() {
  const { movements, locations, lots, transporters, addMovement } = useAppData();

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Movimientos"
        description="Historial de transferencias entre ubicaciones y altas pendientes."
        actions={(
          <Link to="/movements/new">
            <Button><Route size={14} /> Mover stock</Button>
          </Link>
        )}
      />
      <MovementsPanel
        movements={movements}
        locations={locations}
        lots={lots}
        transporters={transporters}
        onAdd={addMovement}
      />
    </>
  );
}
