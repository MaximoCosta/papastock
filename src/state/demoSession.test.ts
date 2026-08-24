import { describe, expect, it } from 'vitest';
import { isDemoSession } from '../state/demoSession';

describe('isDemoSession', () => {
  it('acepta la identidad entregada por Express', () => {
    expect(isDemoSession({
      name: 'Operador PapaStock', username: 'operador', role: 'operator', plant: 'Planta Balcarce', permissions: ['data:read'],
    })).toBe(true);
  });

  it('rechaza objetos incompletos o sin permisos', () => {
    expect(isDemoSession({ username: 'operador' })).toBe(false);
    expect(isDemoSession({ name: 'x', username: 'x', role: 'operator', plant: 'x', permissions: 'data:read' })).toBe(false);
  });
});
