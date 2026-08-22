const STORAGE_KEY = 'papastock.demo-session.v1';

export const DEMO_OPERATOR = {
  username: 'operador',
  password: 'papasud',
  name: 'Mariana López',
  role: 'Coordinación de stock',
  plant: 'Planta Balcarce',
} as const;

export interface DemoSession {
  name: string;
  role: string;
  plant: string;
  username: string;
  signedInAt: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function authenticateDemo(username: string, password: string): DemoSession | undefined {
  const user = normalize(username);
  const acceptedUser = user === DEMO_OPERATOR.username || user === `${DEMO_OPERATOR.username}@papasud.com`;
  if (!acceptedUser || password !== DEMO_OPERATOR.password) return undefined;
  return {
    name: DEMO_OPERATOR.name,
    role: DEMO_OPERATOR.role,
    plant: DEMO_OPERATOR.plant,
    username: DEMO_OPERATOR.username,
    signedInAt: new Date().toISOString(),
  };
}

export function readDemoSession(): DemoSession | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (!parsed.name || !parsed.username) return undefined;
    return {
      name: parsed.name,
      role: parsed.role ?? DEMO_OPERATOR.role,
      plant: parsed.plant ?? DEMO_OPERATOR.plant,
      username: parsed.username,
      signedInAt: parsed.signedInAt ?? new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export function persistDemoSession(session: DemoSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
