import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isDemoSession, type DemoSession } from './demoSession';

interface DemoSessionContextValue {
  session?: DemoSession;
  isCheckingSession: boolean;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const DemoSessionContext = createContext<DemoSessionContextValue | undefined>(undefined);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession>();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch('/api/auth/session', { headers: { accept: 'application/json' } })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { data?: unknown };
        return response.ok && isDemoSession(payload.data) ? payload.data : undefined;
      })
      .then((next) => { if (active) setSession(next); })
      .finally(() => { if (active) setIsCheckingSession(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo<DemoSessionContextValue>(() => ({
    session,
    isCheckingSession,
    signIn: async (username, password) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => ({})) as { data?: unknown };
      const next = response.ok && isDemoSession(payload.data) ? payload.data : undefined;
      setSession(next);
      return Boolean(next);
    },
    signOut: async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', headers: { accept: 'application/json' } });
      } finally {
        setSession(undefined);
      }
    },
  }), [isCheckingSession, session]);

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) throw new Error('useDemoSession must be used within DemoSessionProvider');
  return context;
}
