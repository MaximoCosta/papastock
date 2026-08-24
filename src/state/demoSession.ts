export interface DemoSession {
  name: string;
  role: string;
  plant: string;
  username: string;
  permissions: string[];
}

export function isDemoSession(value: unknown): value is DemoSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DemoSession>;
  return Boolean(
    candidate.name
    && candidate.role
    && candidate.plant
    && candidate.username
    && Array.isArray(candidate.permissions),
  );
}
