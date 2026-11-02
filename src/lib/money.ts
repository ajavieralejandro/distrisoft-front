function toCents(value: string): number {
  const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid money amount: ${value}`);
  }
  const sign = match[1] === '-' ? -1 : 1;
  const whole = match[2] ?? '0';
  const fraction = (match[3] ?? '').padEnd(2, '0').slice(0, 2);
  return sign * (Number(whole) * 100 + Number(fraction));
}

function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${whole}.${fraction}`;
}

export function addMoney(left: string, right: string): string {
  return fromCents(toCents(left) + toCents(right));
}

export function multiplyMoney(unitPrice: string, quantity: number): string {
  if (!Number.isInteger(quantity)) {
    throw new Error('Quantity must be an integer');
  }
  return fromCents(toCents(unitPrice) * quantity);
}

export function subtractMoney(left: string, right: string): string {
  return fromCents(toCents(left) - toCents(right));
}

export function compareMoney(left: string, right: string): number {
  return toCents(left) - toCents(right);
}

export function sumMoney(values: string[]): string {
  return values.reduce((acc, value) => addMoney(acc, value), '0.00');
}

export function divideMoney(total: string, count: number): string {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('Count must be a positive integer');
  }
  return fromCents(Math.round(toCents(total) / count));
}

export function formatMoney(
  value: string | number,
  currency = 'ARS',
  locale = 'es-AR',
): string {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return String(value);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
