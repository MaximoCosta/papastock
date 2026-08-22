import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentPage } from './pages/DocumentPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LocationsPage } from './pages/LocationsPage';
import { LoginPage } from './pages/LoginPage';
import { LotDetailPage } from './pages/LotDetailPage';
import { LotsPage } from './pages/LotsPage';
import { MovementsPage } from './pages/MovementsPage';
import { NewExportPage } from './pages/NewExportPage';
import { NewMovementPage } from './pages/NewMovementPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StockControlPage } from './pages/StockControlPage';
import { StockPage } from './pages/StockPage';
import { TransportersPage } from './pages/TransportersPage';
import { WarehousePage } from './pages/WarehousePage';
import { useDemoSession } from './state/DemoSessionContext';

export default function App() {
  const { session } = useDemoSession();

  if (!session) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="stock/control" element={<StockControlPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="lots" element={<LotsPage />} />
        <Route path="lots/:id" element={<LotDetailPage />} />
        <Route path="transporters" element={<TransportersPage />} />
        <Route path="movements" element={<MovementsPage />} />
        <Route path="movements/new" element={<NewMovementPage />} />
        <Route path="exports" element={<Navigate to="/exports/new" replace />} />
        <Route path="exports/new" element={<NewExportPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
