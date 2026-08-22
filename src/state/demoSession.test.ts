import { describe, expect, it } from 'vitest';
import { authenticateDemo, DEMO_OPERATOR } from '../state/demoSession';

describe('authenticateDemo', () => {
  it('acepta el operador de demostración', () => {
    expect(authenticateDemo('operador', 'papasud')).toMatchObject({
      name: DEMO_OPERATOR.name,
      username: 'operador',
    });
    expect(authenticateDemo('operador@papasud.com', 'papasud')?.username).toBe('operador');
  });

  it('rechaza credenciales inválidas', () => {
    expect(authenticateDemo('operador', 'otra')).toBeUndefined();
    expect(authenticateDemo('admin', 'papasud')).toBeUndefined();
  });
});
