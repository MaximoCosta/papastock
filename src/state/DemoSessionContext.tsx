import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  authenticateDemo,
  clearDemoSession,
  persistDemoSession,
  readDemoSession,
  type DemoSession,
} from './demoSession';

interface DemoSessionContextValue {
  session?: DemoSession;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
}

const DemoSessionContext = createContext<DemoSessionContextValue | undefined>(undefined);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | undefined>(readDemoSession);

  const value = useMemo<DemoSessionContextValue>(() => ({
    session,
    signIn: (username, password) => {
      const next = authenticateDemo(username, password);
      if (!next) return false;
      persistDemoSession(next);
      setSession(next);
      return true;
    },
    signOut: () => {
      clearDemoSession();
      setSession(undefined);
    },
  }), [session]);

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) throw new Error('useDemoSession must be used within DemoSessionProvider');
  return context;
}
