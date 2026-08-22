export type StockHubTab = 'consolidado' | 'ubicaciones' | 'modelo' | 'movimientos' | 'control';

const tabs: { id: StockHubTab; label: string }[] = [
  { id: 'consolidado', label: 'Consolidado' },
  { id: 'ubicaciones', label: 'Ubicaciones' },
  { id: 'modelo', label: 'Modelo depósito' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'control', label: 'Control de stock' },
];

export function StockHubTabs({
  active,
  onChange,
}: {
  active: StockHubTab;
  onChange: (tab: StockHubTab) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-[#d8dad3]" role="tablist" aria-label="Secciones de stock">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px px-4 py-2.5 text-[12px] font-semibold transition-colors ${
              isActive
                ? 'border-b-2 border-[#234b37] text-[#234b37]'
                : 'text-[#6b7169] hover:text-[#30352f]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function parseStockHubTab(value: string | null): StockHubTab {
  if (
    value === 'ubicaciones'
    || value === 'modelo'
    || value === 'movimientos'
    || value === 'control'
    || value === 'consolidado'
  ) {
    return value;
  }
  return 'consolidado';
}
