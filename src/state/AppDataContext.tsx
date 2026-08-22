import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { insertTraceabilityEvent, loadPapaStockSnapshot, type DataSource } from '../repositories/dataRepository';
import { getStockViews } from '../services/stockService';
import type { Location, Lot, Movement, StockRecord, StockView, TraceabilityEvent } from '../types/domain';
import type { GeneratedDocument } from '../types/export';

interface AppDataContextValue {
  locations: Location[];
  lots: Lot[];
  stockRecords: StockRecord[];
  stockViews: StockView[];
  movements: Movement[];
  traceabilityEvents: TraceabilityEvent[];
  generatedDocuments: GeneratedDocument[];
  dataSource: DataSource;
  isLoading: boolean;
  dataWarning?: string;
  actionError?: string;
  addTraceabilityEvent: (event: TraceabilityEvent) => Promise<TraceabilityEvent>;
  addGeneratedDocument: (document: GeneratedDocument) => void;
  clearActionError: () => void;
  refreshData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);
const documentsStorageKey = 'papastock.documents.v1';

function readSessionValue<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [stockRecords, setStockRecords] = useState<StockRecord[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [traceabilityEvents, setTraceabilityEvents] = useState<TraceabilityEvent[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [isLoading, setIsLoading] = useState(true);
  const [dataWarning, setDataWarning] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>(() =>
    readSessionValue(documentsStorageKey, []),
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const result = await loadPapaStockSnapshot();
    setLocations(result.data.locations);
    setLots(result.data.lots);
    setStockRecords(result.data.stockRecords);
    setMovements(result.data.movements);
    setTraceabilityEvents(result.data.traceabilityEvents);
    setDataSource(result.source);
    setDataWarning(result.warning);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    sessionStorage.setItem(documentsStorageKey, JSON.stringify(generatedDocuments));
  }, [generatedDocuments]);

  const stockViews = useMemo(
    () => getStockViews(stockRecords, lots, locations),
    [locations, lots, stockRecords],
  );

  const value = useMemo<AppDataContextValue>(() => ({
    locations,
    lots,
    stockRecords,
    stockViews,
    movements,
    traceabilityEvents,
    generatedDocuments,
    dataSource,
    isLoading,
    dataWarning,
    actionError,
    addTraceabilityEvent: async (event) => {
      setActionError(undefined);
      const equivalent = traceabilityEvents.find(
        (item) => item.lotId === event.lotId && item.type === event.type && item.date === event.date,
      );
      if (equivalent) return equivalent;

      try {
        const saved = dataSource === 'database' ? await insertTraceabilityEvent(event) : event;
        setTraceabilityEvents((current) => {
        const withoutEquivalentEvent = current.filter(
            (item) => !(item.lotId === saved.lotId && item.type === saved.type && item.date === saved.date),
        );
          return [...withoutEquivalentEvent, saved];
        });
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo guardar el evento.';
        setActionError(message);
        throw error;
      }
    },
    addGeneratedDocument: (document) => {
      setGeneratedDocuments((current) => [document, ...current]);
    },
    clearActionError: () => setActionError(undefined),
    refreshData,
  }), [actionError, dataSource, dataWarning, generatedDocuments, isLoading, locations, lots, movements, refreshData, stockRecords, stockViews, traceabilityEvents]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
