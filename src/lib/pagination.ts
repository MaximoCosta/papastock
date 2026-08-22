export const LIST_PAGE_SIZE = 15;

export interface PageWindow {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
}

export function paginate<T>(items: T[], page: number, pageSize = LIST_PAGE_SIZE): PageWindow & { items: T[] } {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    pageSize,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

export function visiblePages(page: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const selected = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) {
    selected.add(2);
    selected.add(3);
    selected.add(4);
  }
  if (page >= pageCount - 2) {
    selected.add(pageCount - 3);
    selected.add(pageCount - 2);
    selected.add(pageCount - 1);
  }

  const sorted = [...selected].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  for (const value of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && value - previous > 1) result.push('ellipsis');
    result.push(value);
  }
  return result;
}
