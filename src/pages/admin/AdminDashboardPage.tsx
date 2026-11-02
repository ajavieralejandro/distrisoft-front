import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  Clock,
  Layers,
  Package,
  PlusCircle,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  buildStats,
  STATS_PERIOD_LABEL,
  type StatsPeriod,
  type StatsSnapshot,
} from '@/domain/stats';
import { formatMoney } from '@/lib/money';
import { services } from '@/services';
import type { Order, Product } from '@/types';

export const AdminDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<StatsPeriod>('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, p] = await Promise.all([
        services.listOrders(),
        services.listProducts(),
      ]);
      setOrders(o);
      setProducts(p);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos del panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats: StatsSnapshot = buildStats(orders, products, period);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome & Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Panel de Supervisión Comercial
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas de ventas, cobranzas y estado de inventario en tiempo real
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs self-start md:self-auto">
          {(['TODAY', 'DAYS_7', 'DAYS_30', 'ALL'] as StatsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {STATS_PERIOD_LABEL[p]}
            </button>
          ))}
          <button
            onClick={loadData}
            title="Actualizar datos"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-1 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold shadow-xs hover:bg-rose-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Pending Orders Attention Alert */}
      {pendingOrdersCount > 0 && (
        <div className="p-4.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'} de confirmación
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Hay pedidos ingresados por los comercios esperando ser preparados y despachados.
              </p>
            </div>
          </div>
          <Link
            to="/admin/pedidos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs"
          >
            Ver Pedidos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Importe Total"
          value={formatMoney(stats.orderAmount)}
          subtitle={`${stats.orderCount} pedidos en el período`}
          icon={<ShoppingBag className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-50"
        />
        <StatCard
          title="Cobrado"
          value={formatMoney(stats.collectedAmount)}
          subtitle="Cobros efectivamente ingresados"
          icon={<Banknote className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Pendiente de Cobro"
          value={formatMoney(stats.outstandingAmount)}
          subtitle="Saldo pendiente de clientes"
          icon={<CircleDollarSign className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Pedidos Activos"
          value={String(stats.orderCount)}
          subtitle="Excluye pedidos cancelados"
          icon={<Layers className="w-6 h-6 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Ticket Promedio"
          value={stats.averageTicket ? formatMoney(stats.averageTicket) : '—'}
          subtitle="Promedio por pedido"
          icon={<Receipt className="w-6 h-6 text-violet-600" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Stock Health & Warnings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-5 rounded-2xl border transition-all ${
            stats.exhaustedCount > 0
              ? 'bg-rose-50/80 border-rose-200'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  stats.exhaustedCount > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Productos Agotados</h4>
                <p className="text-xs text-slate-500">Stock en 0 unidades</p>
              </div>
            </div>
            <span
              className={`text-2xl font-black ${
                stats.exhaustedCount > 0 ? 'text-rose-700' : 'text-slate-400'
              }`}
            >
              {stats.exhaustedCount}
            </span>
          </div>
          {stats.exhaustedCount > 0 && (
            <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center justify-between">
              <span className="text-xs text-rose-800 font-medium">
                Requiere reposición urgente para no rechazar pedidos
              </span>
              <Link
                to="/admin/productos"
                className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
              >
                Gestionar Stock <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        <div
          className={`p-5 rounded-2xl border transition-all ${
            stats.lowStockCount > 0
              ? 'bg-amber-50/80 border-amber-200'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  stats.lowStockCount > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Productos con Stock Bajo</h4>
                <p className="text-xs text-slate-500">Por debajo del umbral mínimo de seguridad</p>
              </div>
            </div>
            <span
              className={`text-2xl font-black ${
                stats.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              {stats.lowStockCount}
            </span>
          </div>
          {stats.lowStockCount > 0 && (
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
              <span className="text-xs text-amber-800 font-medium">
                Próximos a quebrar stock
              </span>
              <Link
                to="/admin/productos"
                className="text-xs font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
              >
                Ver Lista de Reposición <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Top Products and Top Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                Productos Más Vendidos
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {STATS_PERIOD_LABEL[period]}
            </span>
          </div>

          {stats.topProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Sin ventas registradas en este período.
            </div>
          ) : (
            <div className="space-y-4">
              {stats.topProducts.map((p, idx) => {
                const maxAmount = Number(stats.topProducts[0]?.amount || '1');
                const percent = Math.min(
                  100,
                  Math.round((Number(p.amount) / (maxAmount || 1)) * 100),
                );
                return (
                  <div key={p.productId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <span className="text-slate-400">
                          ({p.units} {p.unit.toLowerCase()})
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatMoney(p.amount)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Commerces / Clients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Store className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                Comercios con Mayor Volumen
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {STATS_PERIOD_LABEL[period]}
            </span>
          </div>

          {stats.topClients.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Sin pedidos registrados en este período.
            </div>
          ) : (
            <div className="space-y-4">
              {stats.topClients.map((c, idx) => {
                const maxAmount = Number(stats.topClients[0]?.amount || '1');
                const percent = Math.min(
                  100,
                  Math.round((Number(c.amount) / (maxAmount || 1)) * 100),
                );
                return (
                  <div key={c.commerceId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="text-slate-400">
                          · {c.orderCount} {c.orderCount === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatMoney(c.amount)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Gestión Rápida de Inventario y Clientes</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Accedé directamente al alta de nuevos comercios, actualización de stock mayorista o supervisión de entregas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/admin/comercios"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 text-xs font-bold rounded-xl transition-all shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            Alta de Comercio
          </Link>
          <Link
            to="/admin/productos"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700"
          >
            <Package className="w-4 h-4 text-teal-400" />
            Control de Catálogo
          </Link>
          <Link
            to="/admin/facturacion"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            Facturación y Caja
          </Link>
        </div>
      </div>
    </div>
  );
};
