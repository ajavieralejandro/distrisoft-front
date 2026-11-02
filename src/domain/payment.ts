import { compareMoney, subtractMoney, sumMoney } from '@/lib/money';
import type { Order, PaymentMethod, PaymentStatus } from '@/types';

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Pendiente',
  PARTIAL: 'Pago parcial',
  PAID: 'Pagado',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
};

export function paymentStatusOf(
  order: Pick<Order, 'total' | 'paidAmount'>,
): PaymentStatus {
  if (compareMoney(order.paidAmount, '0.00') <= 0) {
    return 'UNPAID';
  }
  if (compareMoney(order.paidAmount, order.total) >= 0) {
    return 'PAID';
  }
  return 'PARTIAL';
}

export function outstandingOf(order: Pick<Order, 'total' | 'paidAmount'>): string {
  const difference = subtractMoney(order.total, order.paidAmount);
  return compareMoney(difference, '0.00') < 0 ? '0.00' : difference;
}

export function totalOutstanding(orders: Order[]): string {
  return sumMoney(
    orders
      .filter((order) => order.status !== 'CANCELLED')
      .map((order) => outstandingOf(order)),
  );
}
