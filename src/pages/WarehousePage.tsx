import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { WarehouseModelPanel } from '../components/stock/WarehouseModelPanel';
import { useAppData } from '../state/AppDataContext';

export function WarehousePage() {
  const {
    locations,
    shelfUnits,
    shelves,
    stockViews,
    addShelfUnit,
    removeShelfUnit,
    assignStockToShelf,
  } = useAppData();

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Modelo de depósito"
        description="Plano de estanterías y asignación de stock a cada posición."
        actions={<Link to="/locations"><Button variant="secondary">Vista lista</Button></Link>}
      />
      <WarehouseModelPanel
        locations={locations}
        shelfUnits={shelfUnits}
        shelves={shelves}
        stockViews={stockViews}
        onAddUnit={addShelfUnit}
        onRemoveUnit={removeShelfUnit}
        onAssignStock={assignStockToShelf}
      />
    </>
  );
}
