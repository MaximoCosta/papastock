import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentPage } from './pages/DocumentPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LotDetailPage } from './pages/LotDetailPage';
import { LotsPage } from './pages/LotsPage';
import { NewExportPage } from './pages/NewExportPage';
import { NewMovementPage } from './pages/NewMovementPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StockPage } from './pages/StockPage';
import { TransportersPage } from './pages/TransportersPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="lots" element={<LotsPage />} />
        <Route path="lots/:id" element={<LotDetailPage />} />
        <Route path="transporters" element={<TransportersPage />} />
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
