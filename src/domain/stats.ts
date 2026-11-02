import { outstandingOf } from '@/domain/payment';
import { stockCounts } from '@/domain/stock';
import { divideMoney, sumMoney } from '@/lib/money';
import type { Order, Product, ProductUnit } from '@/types';

export type StatsPeriod = 'TODAY' | 'DAYS_7' | 'DAYS_30' | 'ALL';

export const STATS_PERIOD_LABEL: Record<StatsPeriod, string> = {
  TODAY: 'Hoy',
  DAYS_7: 'Últimos 7 días',
  DAYS_30: 'Últimos 30 días',
  ALL: 'Histórico total',
};

export type ProductStat = {
  productId: string;
  name: string;
  unit: ProductUnit;
  units: number;
  amount: string;
};

export type ClientStat = {
  commerceId: string;
  name: string;
  amount: string;
  orderCount: number;
};

export type StatsSnapshot = {
  orderAmount: string;
  collectedAmount: string;
  outstandingAmount: string;
  orderCount: number;
  averageTicket: string | null;
  topProducts: ProductStat[];
  topClients: ClientStat[];
  exhaustedCount: number;
  lowStockCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function periodStart(period: StatsPeriod, now: Date): number | null {
  if (period === 'ALL') {
    return null;
  }
  if (period === 'TODAY') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  const days = period === 'DAYS_7' ? 7 : 30;
  return now.getTime() - days * DAY_MS;
}

export function isInPeriod(iso: string, start: number | null, now: Date): boolean {
  if (start == null) {
    return true;
  }
  const time = new Date(iso).getTime();
  return time >= start && time <= now.getTime();
}

function topProducts(orders: Order[]): ProductStat[] {
  const byProduct = new Map<string, ProductStat>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        unit: item.unit,
        units: 0,
        amount: '0.00',
      };
      current.units += item.quantity;
      current.amount = sumMoney([current.amount, item.lineTotal]);
      byProduct.set(item.productId, current);
    }
  }
  return Array.from(byProduct.values())
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);
}

function topClients(orders: Order[]): ClientStat[] {
  const byClient = new Map<string, ClientStat>();
  for (const order of orders) {
    const current = byClient.get(order.commerceId) ?? {
      commerceId: order.commerceId,
      name: order.commerceName,
      amount: '0.00',
      orderCount: 0,
    };
    current.orderCount += 1;
    current.amount = sumMoney([current.amount, order.total]);
    byClient.set(order.commerceId, current);
  }
  return Array.from(byClient.values())
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);
}

export function buildStats(
  orders: Order[],
  products: Product[],
  period: StatsPeriod,
  now = new Date(),
): StatsSnapshot {
  const start = periodStart(period, now);
  const active = orders.filter(
    (order) =>
      order.status !== 'CANCELLED' && isInPeriod(order.createdAt, start, now),
  );
  const orderAmount = sumMoney(active.map((order) => order.total));
  const collectedAmount = sumMoney(active.map((order) => order.paidAmount));
  const outstandingAmount = sumMoney(active.map((order) => outstandingOf(order)));
  const stock = stockCounts(products);

  return {
    orderAmount,
    collectedAmount,
    outstandingAmount,
    orderCount: active.length,
    averageTicket: active.length === 0 ? null : divideMoney(orderAmount, active.length),
    topProducts: topProducts(active),
    topClients: topClients(active),
    exhaustedCount: stock.exhausted,
    lowStockCount: stock.low,
  };
}
