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
    dataSource,
    addShelfUnit,
    removeShelfUnit,
    assignStockToShelf,
  } = useAppData();

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Modelo de depósito"
        description="Plano de estanterías persistido en PostgreSQL. Las asignaciones de stock actualizan el registro operativo."
        actions={<Link to="/locations"><Button variant="secondary">Vista lista</Button></Link>}
      />
      {dataSource === 'unavailable' ? (
        <div className="border border-[#d8dad3] bg-white p-5 text-[12px] text-[#5f645d]">
          La fuente operativa no está disponible. No se puede mostrar el modelo de depósito.
        </div>
      ) : (
        <WarehouseModelPanel
          locations={locations}
          shelfUnits={shelfUnits}
          shelves={shelves}
          stockViews={stockViews}
          onAddUnit={addShelfUnit}
          onRemoveUnit={removeShelfUnit}
          onAssignStock={assignStockToShelf}
        />
      )}
    </>
  );
}
