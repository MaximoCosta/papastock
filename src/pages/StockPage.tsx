import { ClipboardCheck, ClipboardList, Filter, PackagePlus, Search, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { PaginationBar } from '../components/common/PaginationBar';
import { PlanillaImportPanel } from '../components/stock/PlanillaImportPanel';
import { StockIntakeForm } from '../components/stock/StockIntakeForm';
import { StockTable } from '../components/stock/StockTable';
import { VarietyStockPanel } from '../components/stock/VarietyStockPanel';
import { StockVerificationForm } from '../components/stock/StockVerificationForm';
import { paginate } from '../lib/pagination';
import { mockDocumentService } from '../services/documentService';
import { useAppData } from '../state/AppDataContext';
import type { StockStatus } from '../types/domain';

const tabRedirects: Record<string, string> = {
  ubicaciones: '/locations',
  modelo: '/warehouse',
  movimientos: '/movements',
  control: '/stock/control',
};

export function StockPage() {
  const {
    locations,
    stockViews,
    dataSource,
    addGeneratedDocument,
    applyStockVerification,
    refreshData,
    applyImportedSnapshot,
  } = useAppData();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyRecordId, setVerifyRecordId] = useState<string>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [locationId, setLocationId] = useState('all');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StockStatus | 'all'>(() => {
    const initial = searchParams.get('status');
    return initial === 'verified' || initial === 'discrepancy' || initial === 'pending' ? initial : 'all';
  });

  const records = useMemo(() => stockViews.filter((record) => {
    const matchesQuery = record.lot.code.toLowerCase().includes(query.trim().toLowerCase());
    const matchesLocation = locationId === 'all' || record.locationId === locationId;
    const matchesStatus = status === 'all' || record.status === status;
    return matchesQuery && matchesLocation && matchesStatus;
  }), [locationId, query, status, stockViews]);

  const tab = searchParams.get('tab');
  if (tab && tabRedirects[tab]) {
    return <Navigate to={tabRedirects[tab]} replace />;
  }

  useEffect(() => {
    setPage(1);
  }, [query, locationId, status]);

  const pageWindow = paginate(records, page);

  function generatePlanilla() {
    const scopeLabel = locationId === 'all' ? 'Todas las ubicaciones' : locations.find((location) => location.id === locationId)?.name ?? 'Ubicación filtrada';
    const document = mockDocumentService.createPlanillaStock(records, scopeLabel);
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Stock operativo"
        description="Consolidado declarado vs verificado, por lote y ubicación."
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIntakeOpen((value) => !value)}>
              <PackagePlus size={14} /> Cargar stock
            </Button>
            <Button variant="secondary" onClick={() => { setVerifyRecordId(undefined); setVerifyOpen((value) => !value); }}>
              <ClipboardCheck size={14} /> Verificar stock
            </Button>
            <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
              <Upload size={14} /> Subir archivo
            </Button>
            <Button variant="secondary" onClick={generatePlanilla} disabled={records.length === 0}>
              <ClipboardList size={14} /> Generar planilla
            </Button>
          </div>
        )}
      />

      {verifyOpen && (
        <StockVerificationForm
          records={stockViews}
          initialRecordId={verifyRecordId}
          onClose={() => setVerifyOpen(false)}
          onVerified={async (confirmation) => {
            applyStockVerification(confirmation.correction, confirmation.event);
            setVerifyOpen(false);
          }}
        />
      )}

      {intakeOpen && (
        <StockIntakeForm
          locations={locations}
          onClose={() => setIntakeOpen(false)}
          onLoaded={async (confirmation) => {
            applyImportedSnapshot(confirmation.applied);
            if (dataSource === 'database') await refreshData();
            setIntakeOpen(false);
          }}
        />
      )}

      <div className="mb-4">
        <PlanillaImportPanel
          fileInputRef={importInputRef}
          onImported={async (confirmation) => {
            applyImportedSnapshot(confirmation.applied);
            if (dataSource === 'database') await refreshData();
          }}
        />
      </div>

      <section className="mb-4 border border-[#d8dad3] bg-white p-3">
        <div className="grid grid-cols-[minmax(240px,1fr)_220px_190px_auto] items-center gap-3 max-[1100px]:grid-cols-1">
          <label className="relative">
            <span className="sr-only">Buscar por lote</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737970]" />
            <input className="field field-leading-icon min-h-10 text-[12px]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lote..." />
          </label>
          <label>
            <span className="sr-only">Filtrar por ubicación</span>
            <select className="field min-h-10 text-[12px]" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="all">Todas las ubicaciones</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select className="field min-h-10 text-[12px]" value={status} onChange={(event) => setStatus(event.target.value as StockStatus | 'all')}>
              <option value="all">Todos los estados</option>
              <option value="verified">Verificado</option>
              <option value="discrepancy">Discrepancia</option>
              <option value="pending">Pendiente</option>
            </select>
          </label>
          <div className="flex items-center justify-end gap-2 px-2 text-[10px] font-semibold text-[#747970]">
            <Filter size={13} /> {records.length} de {stockViews.length}
          </div>
        </div>
      </section>
      <VarietyStockPanel records={records} />
      <StockTable
        records={pageWindow.items}
        footer={<PaginationBar window={pageWindow} onPageChange={setPage} noun="registros" />}
        onVerify={(record) => {
          setVerifyRecordId(record.id);
          setVerifyOpen(true);
        }}
      />
    </>
  );
}
