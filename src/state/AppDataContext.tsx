import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { insertTraceabilityEvent, loadPapaStockSnapshot, type DataSource } from '../repositories/dataRepository';
import {
  assignStockToShelfRemote,
  createShelfUnit,
  createTransporter,
  deleteShelfUnitRemote,
  updateTransporterRemote,
} from '../services/catalogService';
import { loadStoredDocuments, persistDocuments } from '../services/documentService';
import { getStockViews } from '../services/stockService';
import type {
  Location,
  Lot,
  Movement,
  Shelf,
  ShelfUnit,
  ShelfUnitInput,
  StockControlCorrection,
  StockRecord,
  StockView,
  TraceabilityEvent,
  Transporter,
  TransporterInput,
} from '../types/domain';
import type { GeneratedDocument } from '../types/export';
import { isExplicitMockMode } from '../config/dataMode';
import { useDemoSession } from './DemoSessionContext';

export type { TransporterInput, ShelfUnitInput };
export type AddShelfUnitInput = ShelfUnitInput;

interface AppDataContextValue {
  locations: Location[];
  shelfUnits: ShelfUnit[];
  shelves: Shelf[];
  lots: Lot[];
  stockRecords: StockRecord[];
  stockViews: StockView[];
  movements: Movement[];
  transporters: Transporter[];
  traceabilityEvents: TraceabilityEvent[];
  generatedDocuments: GeneratedDocument[];
  dataSource: DataSource;
  isLoading: boolean;
  dataWarning?: string;
  actionError?: string;
  addTraceabilityEvent: (event: TraceabilityEvent) => Promise<TraceabilityEvent>;
  addGeneratedDocument: (document: GeneratedDocument) => void;
  addGeneratedDocuments: (documents: GeneratedDocument[]) => void;
  applyStockCorrections: (corrections: StockControlCorrection[]) => void;
  applyStockVerification: (correction: StockControlCorrection, event?: TraceabilityEvent) => void;
  addMovement: (movement: Movement) => void;
  addShelfUnit: (input: AddShelfUnitInput) => Promise<ShelfUnit>;
  removeShelfUnit: (unitId: string) => Promise<void>;
  assignStockToShelf: (stockRecordId: string, shelfId: string | undefined) => Promise<void>;
  addTransporter: (input: TransporterInput) => Promise<Transporter>;
  updateTransporter: (id: string, input: TransporterInput) => Promise<void>;
  clearActionError: () => void;
  refreshData: () => Promise<void>;
  applyImportedSnapshot: (applied: {
    locations: Location[];
    lots: Lot[];
    stockRecords: StockRecord[];
    movements: Movement[];
  }) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session, isCheckingSession } = useDemoSession();
  const [locations, setLocations] = useState<Location[]>([]);
  const [shelfUnits, setShelfUnits] = useState<ShelfUnit[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [stockRecords, setStockRecords] = useState<StockRecord[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [traceabilityEvents, setTraceabilityEvents] = useState<TraceabilityEvent[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>(isExplicitMockMode() ? 'mock' : 'unavailable');
  const [isLoading, setIsLoading] = useState(true);
  const [dataWarning, setDataWarning] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>(loadStoredDocuments);

  const refreshData = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    const result = await loadPapaStockSnapshot();
    setLocations(result.data.locations);
    setShelfUnits(result.data.shelfUnits);
    setShelves(result.data.shelves);
    setLots(result.data.lots);
    setStockRecords(result.data.stockRecords);
    setMovements(result.data.movements);
    setTransporters(result.data.transporters);
    setTraceabilityEvents(result.data.traceabilityEvents);
    setDataSource(result.source);
    setDataWarning(result.warning);
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (isCheckingSession) return;
    if (session) {
      void refreshData();
      return;
    }
    setLocations([]);
    setShelfUnits([]);
    setShelves([]);
    setLots([]);
    setStockRecords([]);
    setMovements([]);
    setTransporters([]);
    setTraceabilityEvents([]);
    setDataSource(isExplicitMockMode() ? 'mock' : 'unavailable');
    setIsLoading(false);
  }, [isCheckingSession, refreshData, session]);

  useEffect(() => {
    persistDocuments(generatedDocuments);
  }, [generatedDocuments]);

  const stockViews = useMemo(
    () => getStockViews(stockRecords, lots, locations),
    [locations, lots, stockRecords],
  );

  const value = useMemo<AppDataContextValue>(() => ({
    locations,
    shelfUnits,
    shelves,
    lots,
    stockRecords,
    stockViews,
    movements,
    transporters,
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
        if (dataSource === 'unavailable') throw new Error('La fuente operativa no está disponible.');
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
    addGeneratedDocuments: (documents) => {
      if (documents.length === 0) return;
      setGeneratedDocuments((current) => [...documents, ...current]);
    },
    applyStockCorrections: (corrections) => {
      if (corrections.length === 0) return;
      const now = new Date().toISOString();
      const byId = new Map(corrections.map((item) => [item.stockRecordId, item]));
      setStockRecords((current) => current.map((record) => {
        const correction = byId.get(record.id);
        if (!correction) return record;
        return {
          ...record,
          verifiedQuantity: correction.countedQuantity,
          verificationPending: false,
          updatedAt: now,
        };
      }));
    },
    applyStockVerification: (correction, event) => {
      const now = new Date().toISOString();
      setStockRecords((current) => current.map((record) => (
        record.id === correction.stockRecordId
          ? {
              ...record,
              verifiedQuantity: correction.countedQuantity,
              verificationPending: false,
              updatedAt: now,
              version: correction.newVersion ?? record.version,
            }
          : record
      )));
      if (!event) return;
      setTraceabilityEvents((current) => {
        const withoutEquivalent = current.filter(
          (item) => !(item.lotId === event.lotId && item.type === event.type && item.date.slice(0, 10) === event.date.slice(0, 10)),
        );
        return [...withoutEquivalent, event];
      });
    },
    addMovement: (movement) => {
      setMovements((current) => [movement, ...current]);
    },
    addShelfUnit: async (input) => {
      setActionError(undefined);
      if (dataSource === 'database') {
        const created = await createShelfUnit(input);
        setShelfUnits((current) => [...current, created.unit]);
        setShelves((current) => [...current, ...created.shelves]);
        return created.unit;
      }
      if (dataSource !== 'mock') {
        const message = 'La fuente operativa no está disponible.';
        setActionError(message);
        throw new Error(message);
      }
      const levels = Math.max(1, Math.min(6, Math.round(input.levelCount) || 1));
      const unitId = `unit-${Date.now()}`;
      const unit: ShelfUnit = {
        id: unitId,
        locationId: input.locationId,
        code: input.code.trim().toUpperCase(),
        label: input.label.trim() || `Estantería ${input.code}`,
        gridRow: input.gridRow,
        gridCol: input.gridCol,
      };
      const capacity = input.capacityKgPerLevel ?? 20000;
      const newShelves: Shelf[] = Array.from({ length: levels }, (_, index) => {
        const level = index + 1;
        return {
          id: `${unitId}-L${level}`,
          locationId: input.locationId,
          shelfUnitId: unitId,
          code: `${unit.code}${level}`,
          label: `${unit.label} · Nivel ${level}`,
          level,
          capacityKg: capacity,
        };
      });
      setShelfUnits((current) => [...current, unit]);
      setShelves((current) => [...current, ...newShelves]);
      return unit;
    },
    removeShelfUnit: async (unitId) => {
      setActionError(undefined);
      if (dataSource === 'database') {
        await deleteShelfUnitRemote(unitId);
      } else if (dataSource !== 'mock') {
        setActionError('La fuente operativa no está disponible.');
        return;
      }
      setShelves((currentShelves) => {
        const levelIds = new Set(currentShelves.filter((shelf) => shelf.shelfUnitId === unitId).map((shelf) => shelf.id));
        setStockRecords((current) => current.map((record) => (
          record.shelfId && levelIds.has(record.shelfId)
            ? { ...record, shelfId: undefined }
            : record
        )));
        return currentShelves.filter((shelf) => shelf.shelfUnitId !== unitId);
      });
      setShelfUnits((current) => current.filter((unit) => unit.id !== unitId));
    },
    assignStockToShelf: async (stockRecordId, shelfId) => {
      setActionError(undefined);
      if (dataSource === 'database') {
        await assignStockToShelfRemote(stockRecordId, shelfId);
      } else if (dataSource !== 'mock') {
        setActionError('La fuente operativa no está disponible.');
        return;
      }
      setStockRecords((current) => {
        const shelf = shelfId
          ? shelves.find((item) => item.id === shelfId)
          : undefined;
        return current.map((record) => {
          if (record.id !== stockRecordId) return record;
          return {
            ...record,
            shelfId: shelf?.id,
            locationId: shelf?.locationId ?? record.locationId,
            updatedAt: new Date().toISOString(),
          };
        });
      });
    },
    addTransporter: async (input) => {
      setActionError(undefined);
      if (dataSource === 'database') {
        const created = await createTransporter(input);
        setTransporters((current) => [created, ...current]);
        return created;
      }
      if (dataSource !== 'mock') {
        const message = 'La fuente operativa no está disponible.';
        setActionError(message);
        throw new Error(message);
      }
      const transporter: Transporter = { ...input, id: `tr-${Date.now()}` };
      setTransporters((current) => [transporter, ...current]);
      return transporter;
    },
    updateTransporter: async (id, input) => {
      setActionError(undefined);
      if (dataSource === 'database') {
        const updated = await updateTransporterRemote(id, input);
        setTransporters((current) => current.map((item) => (item.id === id ? updated : item)));
        return;
      }
      if (dataSource !== 'mock') {
        setActionError('La fuente operativa no está disponible.');
        return;
      }
      setTransporters((current) => current.map((item) => (item.id === id ? { ...input, id } : item)));
    },
    applyImportedSnapshot: (applied) => {
      setLocations(applied.locations);
      setLots(applied.lots);
      setStockRecords(applied.stockRecords);
      setMovements(applied.movements);
    },
    clearActionError: () => setActionError(undefined),
    refreshData,
  }), [
    actionError,
    dataSource,
    dataWarning,
    generatedDocuments,
    isLoading,
    locations,
    lots,
    movements,
    refreshData,
    shelfUnits,
    shelves,
    stockRecords,
    stockViews,
    traceabilityEvents,
    transporters,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
