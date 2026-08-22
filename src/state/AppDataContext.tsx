import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initialTraceabilityEvents } from '../data/traceability';
import type { TraceabilityEvent } from '../types/domain';
import type { GeneratedDocument } from '../types/export';

interface AppDataContextValue {
  traceabilityEvents: TraceabilityEvent[];
  generatedDocuments: GeneratedDocument[];
  addTraceabilityEvent: (event: TraceabilityEvent) => void;
  addGeneratedDocument: (document: GeneratedDocument) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);
const traceabilityStorageKey = 'papastock.traceability.v1';
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
  const [traceabilityEvents, setTraceabilityEvents] = useState<TraceabilityEvent[]>(() =>
    readSessionValue(traceabilityStorageKey, initialTraceabilityEvents),
  );
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>(() =>
    readSessionValue(documentsStorageKey, []),
  );

  useEffect(() => {
    sessionStorage.setItem(traceabilityStorageKey, JSON.stringify(traceabilityEvents));
  }, [traceabilityEvents]);

  useEffect(() => {
    sessionStorage.setItem(documentsStorageKey, JSON.stringify(generatedDocuments));
  }, [generatedDocuments]);

  const value = useMemo<AppDataContextValue>(() => ({
    traceabilityEvents,
    generatedDocuments,
    addTraceabilityEvent: (event) => {
      setTraceabilityEvents((current) => {
        const withoutEquivalentEvent = current.filter(
          (item) => !(item.lotId === event.lotId && item.type === event.type && item.date === event.date),
        );
        return [...withoutEquivalentEvent, event];
      });
    },
    addGeneratedDocument: (document) => {
      setGeneratedDocuments((current) => [document, ...current]);
    },
  }), [generatedDocuments, traceabilityEvents]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
