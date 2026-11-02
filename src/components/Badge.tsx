import React from 'react';
import type { CommerceStatus, OrderStatus, PaymentStatus } from '@/types';

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: 'Pendiente',
    bg: 'bg-amber-50 border-amber-200/80',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmado',
    bg: 'bg-blue-50 border-blue-200/80',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  PREPARING: {
    label: 'En preparación',
    bg: 'bg-indigo-50 border-indigo-200/80',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  DELIVERED: {
    label: 'Entregado',
    bg: 'bg-emerald-50 border-emerald-200/80',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: 'bg-rose-50 border-rose-200/80',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  UNPAID: {
    label: 'Impago',
    bg: 'bg-rose-50 border-rose-200/70',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  PARTIAL: {
    label: 'Pago parcial',
    bg: 'bg-amber-50 border-amber-200/70',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  PAID: {
    label: 'Pagado',
    bg: 'bg-emerald-50 border-emerald-200/70',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.UNPAID;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const CommerceStatusBadge: React.FC<{ status: CommerceStatus }> = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        isActive
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
      />
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
};

export const StockBadge: React.FC<{ stock: number; minStock?: number }> = ({
  stock,
  minStock = 10,
}) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Agotado ({stock})
      </span>
    );
  }
  if (stock <= minStock) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Stock bajo ({stock})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {stock} unidades
    </span>
  );
};
