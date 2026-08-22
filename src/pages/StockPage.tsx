import { ClipboardList, Filter, PackagePlus, Search, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { LocationsPanel } from '../components/stock/LocationsPanel';
import { MovementsPanel } from '../components/stock/MovementsPanel';
import { PlanillaImportPanel } from '../components/stock/PlanillaImportPanel';
import { StockIntakeForm } from '../components/stock/StockIntakeForm';
import { StockControlWizard } from '../components/stock/StockControlWizard';
import { parseStockHubTab, StockHubTabs, type StockHubTab } from '../components/stock/StockHubTabs';
import { StockTable } from '../components/stock/StockTable';
import { WarehouseModelPanel } from '../components/stock/WarehouseModelPanel';
import { mockDocumentService } from '../services/documentService';
import { useAppData } from '../state/AppDataContext';
import type { StockStatus } from '../types/domain';

export function StockPage() {
  const {
    locations,
    shelfUnits,
    shelves,
    lots,
    stockViews,
    movements,
    transporters,
    dataSource,
    addGeneratedDocument,
    applyStockCorrections,
    addMovement,
    addShelfUnit,
    removeShelfUnit,
    assignStockToShelf,
    refreshData,
    applyImportedSnapshot,
  } = useAppData();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [locationId, setLocationId] = useState('all');
  const [status, setStatus] = useState<StockStatus | 'all'>(() => {
    const initial = searchParams.get('status');
    return initial === 'verified' || initial === 'discrepancy' || initial === 'pending' ? initial : 'all';
  });

  const activeTab = parseStockHubTab(searchParams.get('tab'));

  function setTab(tab: StockHubTab) {
    const next = new URLSearchParams(searchParams);
    if (tab === 'consolidado') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }

  const records = useMemo(() => stockViews.filter((record) => {
    const matchesQuery = record.lot.code.toLowerCase().includes(query.trim().toLowerCase());
    const matchesLocation = locationId === 'all' || record.locationId === locationId;
    const matchesStatus = status === 'all' || record.status === status;
    return matchesQuery && matchesLocation && matchesStatus;
  }), [locationId, query, status, stockViews]);

  function generatePlanilla() {
    const scopeLabel = locationId === 'all' ? 'Todas las ubicaciones' : locations.find((location) => location.id === locationId)?.name ?? 'Ubicación filtrada';
    const document = mockDocumentService.createPlanillaStock(records, scopeLabel);
    addGeneratedDocument(document);
    navigate(`/documents/${document.id}`);
  }

  const uploadButton = (
    <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
      <Upload size={14} /> Subir archivo
    </Button>
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => setIntakeOpen((value) => !value)}>
        <PackagePlus size={14} /> Cargar stock
      </Button>
      {uploadButton}
      {activeTab === 'consolidado' ? (
        <Button variant="secondary" onClick={generatePlanilla} disabled={records.length === 0}>
          <ClipboardList size={14} /> Generar planilla
        </Button>
      ) : activeTab === 'control' ? (
        <Button variant="secondary" onClick={() => setTab('consolidado')}>Ver consolidado</Button>
      ) : activeTab === 'modelo' ? (
        <Button variant="secondary" onClick={() => setTab('ubicaciones')}>Vista lista</Button>
      ) : null}
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Stock operativo"
        description="Consolidado, ubicaciones, modelo de depósito, movimientos y control físico con planilla + foto IA."
        actions={headerActions}
      />

      {intakeOpen && (
        <StockIntakeForm
          locations={locations}
          onClose={() => setIntakeOpen(false)}
          onLoaded={async (confirmation) => {
            applyImportedSnapshot(confirmation.applied);
            if (dataSource === 'database') await refreshData();
            setIntakeOpen(false);
            setTab('consolidado');
          }}
        />
      )}

      <div className="mb-4">
        <PlanillaImportPanel
          fileInputRef={importInputRef}
          onImported={async (confirmation) => {
            applyImportedSnapshot(confirmation.applied);
            if (dataSource === 'database') await refreshData();
            setTab('consolidado');
          }}
        />
      </div>

      <StockHubTabs active={activeTab} onChange={setTab} />

      {activeTab === 'consolidado' && (
        <>
          <section className="mb-4 border border-[#d8dad3] bg-white p-3">
            <div className="grid grid-cols-[minmax(240px,1fr)_220px_190px_auto] items-center gap-3 max-[1100px]:grid-cols-1">
              <label className="relative">
                <span className="sr-only">Buscar por lote</span>
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737970]" />
                <input className="field min-h-10 pl-9 text-[12px]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lote..." />
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
          <StockTable records={records} />
        </>
      )}

      {activeTab === 'ubicaciones' && (
        <LocationsPanel
          locations={locations}
          shelfUnits={shelfUnits}
          shelves={shelves}
          stockViews={stockViews}
        />
      )}

      {activeTab === 'modelo' && (
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

      {activeTab === 'movimientos' && (
        <MovementsPanel
          movements={movements}
          locations={locations}
          lots={lots}
          transporters={transporters}
          onAdd={addMovement}
        />
      )}

      {activeTab === 'control' && (
        <StockControlWizard
          locations={locations}
          shelves={shelves}
          stockViews={stockViews}
          onApply={applyStockCorrections}
          onCreateDocument={addGeneratedDocument}
          onReset={refreshData}
        />
      )}
    </>
  );
}
