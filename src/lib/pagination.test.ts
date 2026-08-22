import { describe, expect, it } from 'vitest';
import { paginate, visiblePages } from './pagination';

describe('paginate', () => {
  it('corta de a 15 y corrige páginas fuera de rango', () => {
    const items = Array.from({ length: 37 }, (_, index) => index + 1);
    expect(paginate(items, 1).items).toEqual(items.slice(0, 15));
    expect(paginate(items, 3)).toMatchObject({ items: items.slice(30, 37), page: 3, pageCount: 3, from: 31, to: 37 });
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate([], 2)).toMatchObject({ items: [], page: 1, from: 0, to: 0 });
  });
});

describe('visiblePages', () => {
  it('lista todas las páginas cuando hay pocas', () => {
    expect(visiblePages(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it('inserta elipsis en listas largas', () => {
    expect(visiblePages(1, 12)).toEqual([1, 2, 3, 4, 'ellipsis', 12]);
    expect(visiblePages(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
    expect(visiblePages(12, 12)).toEqual([1, 'ellipsis', 9, 10, 11, 12]);
  });
});
