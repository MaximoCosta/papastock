const numberFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});
const compactDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

export function formatKg(value: number): string {
  return `${numberFormatter.format(value)} kg`;
}

export { formatQuantity } from './quantity';

export function formatSignedKg(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${numberFormatter.format(value)} kg`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatMoney(value: number, currency = 'USD'): string {
  return `${currency} ${currencyFormatter.format(value)}`;
}

export function formatDate(value: string): string {
  return shortDateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export function formatCompactDate(value: string): string {
  return compactDateFormatter
    .format(new Date(`${value.slice(0, 10)}T12:00:00Z`))
    .replace('.', '')
    .toUpperCase();
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

