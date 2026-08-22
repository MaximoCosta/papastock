import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { StockControlWizard } from '../components/stock/StockControlWizard';
import { useAppData } from '../state/AppDataContext';

export function StockControlPage() {
  const {
    locations,
    shelves,
    stockViews,
    addGeneratedDocument,
    applyStockCorrections,
    refreshData,
  } = useAppData();

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Control de stock"
        description="Planilla de conteo físico, foto e interpretación asistida. Las correcciones quedan en esta sesión."
        actions={<Link to="/stock"><Button variant="secondary">Ver consolidado</Button></Link>}
      />
      <StockControlWizard
        locations={locations}
        shelves={shelves}
        stockViews={stockViews}
        onApply={applyStockCorrections}
        onCreateDocument={addGeneratedDocument}
        onReset={refreshData}
      />
    </>
  );
}
