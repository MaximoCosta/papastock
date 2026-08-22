import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { LocationsPanel } from '../components/stock/LocationsPanel';
import { useAppData } from '../state/AppDataContext';

export function LocationsPage() {
  const { locations, shelfUnits, shelves, stockViews } = useAppData();

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Ubicaciones"
        description="Cámaras, galpón y ocupación por estantería."
        actions={<Link to="/warehouse"><Button variant="secondary">Ver modelo de depósito</Button></Link>}
      />
      <LocationsPanel
        locations={locations}
        shelfUnits={shelfUnits}
        shelves={shelves}
        stockViews={stockViews}
      />
    </>
  );
}
