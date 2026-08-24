export function isExplicitMockMode(): boolean {
  return import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase() === 'mock';
}
