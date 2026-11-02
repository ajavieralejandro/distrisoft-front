import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { AdminCreateOrderModal } from '@/components/AdminCreateOrderModal';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/Badge';
import { Modal } from '@/components/Modal';
import {
  outstandingOf,
  paymentStatusOf,
  PAYMENT_METHOD_LABEL,
} from '@/domain/payment';
import { formatDateTime } from '@/lib/datetime';
import { formatMoney } from '@/lib/money';
import { services } from '@/services';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals for actions
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryCashAmount, setDeliveryCashAmount] = useState('');

  // Create Order Modal for Admin
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await services.listOrders({
        status: statusFilter,
        search: searchTerm,
      });
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar listado de pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  // Client-side filtering for payment status and search
  const filteredOrders = orders.filter((o) => {
    if (paymentFilter !== 'ALL') {
      const status = paymentStatusOf(o);
      if (status !== paymentFilter) return false;
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchId = o.id.toLowerCase().includes(s);
      const matchCommerce = o.commerceName.toLowerCase().includes(s);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(s));
      if (!matchId && !matchCommerce && !matchItem) return false;
    }
    return true;
  });

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const updated = await services.updateOrderStatus(selectedOrder.id, newStatus);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      setActionError(err?.message || 'Error al actualizar estado del pedido');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !paymentAmount.trim()) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const updated = await services.registerCashPayment(selectedOrder.id, paymentAmount.trim());
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setShowPaymentModal(false);
      setPaymentAmount('');
    } catch (err: any) {
      setActionError(err?.message || 'Error al registrar el cobro');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      const updated = await services.completeDelivery(
        selectedOrder.id,
        deliveryCashAmount.trim() || undefined,
      );
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setShowDeliveryModal(false);
      setDeliveryCashAmount('');
    } catch (err: any) {
      setActionError(err?.message || 'Error al completar la entrega');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestión y Despacho de Pedidos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Supervisión del ciclo de vida de pedidos, cobros y entregas a comercios
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={loadOrders}
            className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            Actualizar
          </button>

          <button
            onClick={() => setShowCreateOrderModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Pedido para Cliente</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PENDING', label: 'Pendientes' },
            { id: 'CONFIRMED', label: 'Confirmados' },
            { id: 'PREPARING', label: 'En Preparación' },
            { id: 'DELIVERED', label: 'Entregados' },
            { id: 'CANCELLED', label: 'Cancelados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Secondary Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por ID, comercio o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Cobro:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Cualquier estado de pago</option>
              <option value="UNPAID">Impagos</option>
              <option value="PARTIAL">Pago parcial</option>
              <option value="PAID">Completamente pagados</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron pedidos</h3>
            <p className="text-xs text-slate-400 mt-1">
              Probá cambiando los filtros o emití un nuevo pedido para un cliente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Pedido / ID</th>
                  <th className="py-3 px-4">Comercio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Importe / Pago</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map((order) => {
                  const paymentStatus = paymentStatusOf(order);
                  const outstanding = outstandingOf(order);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                          {order.commerceName}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900">
                          {formatMoney(order.total)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PaymentStatusBadge status={paymentStatus} />
                          {Number(outstanding) > 0 && paymentStatus !== 'UNPAID' && (
                            <span className="text-[10px] text-slate-400">
                              Resta: {formatMoney(outstanding)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {order.delivery.mode === 'DELIVERY' ? (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Truck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate max-w-[140px]" title={order.delivery.address}>
                              {order.delivery.city || 'Envío'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Retiro en depósito</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Detalle
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => {
            setSelectedOrder(null);
            setActionError(null);
          }}
          title={`Detalle de Pedido ${selectedOrder.id}`}
          subtitle={`Ingresado para ${selectedOrder.commerceName} el ${formatDateTime(selectedOrder.createdAt)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-sm">
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Badges Overview */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">Estado:</span>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">Cobro:</span>
                <PaymentStatusBadge status={paymentStatusOf(selectedOrder)} />
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Artículos Solicitados ({selectedOrder.items.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        SKU: {item.sku} · {item.quantity} {item.unit.toLowerCase()} × {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal productos:</span>
                <span className="font-medium">{formatMoney(selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Abonado hasta ahora:</span>
                <span className="font-bold text-emerald-700">
                  {formatMoney(selectedOrder.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                <span>Saldo pendiente de cobro:</span>
                <span className="font-black text-teal-800">
                  {formatMoney(outstandingOf(selectedOrder))}
                </span>
              </div>
              {selectedOrder.paymentMethod && (
                <div className="pt-1 text-[11px] text-slate-500">
                  Método acordado: {PAYMENT_METHOD_LABEL[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                </div>
              )}
            </div>

            {/* Delivery / Logistics Information */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                {selectedOrder.delivery.mode === 'DELIVERY' ? (
                  <>
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span>Envío a Domicilio</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>Retiro por Depósito Mayorista</span>
                  </>
                )}
              </div>
              {selectedOrder.delivery.mode === 'DELIVERY' && (
                <>
                  <p>
                    <span className="text-slate-400">Destinatario:</span>{' '}
                    {selectedOrder.delivery.recipient || selectedOrder.commerceName}
                  </p>
                  <p>
                    <span className="text-slate-400">Dirección:</span>{' '}
                    {selectedOrder.delivery.address}, {selectedOrder.delivery.city}
                  </p>
                  {selectedOrder.delivery.phone && (
                    <p>
                      <span className="text-slate-400">Teléfono:</span>{' '}
                      {selectedOrder.delivery.phone}
                    </p>
                  )}
                  {selectedOrder.delivery.references && (
                    <p>
                      <span className="text-slate-400">Referencias:</span>{' '}
                      {selectedOrder.delivery.references}
                    </p>
                  )}
                </>
              )}
              {selectedOrder.observations && (
                <p className="mt-2 text-slate-500 italic">
                  Nota del cliente: "{selectedOrder.observations}"
                </p>
              )}
            </div>

            {/* Action Bar / Status Transitions */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Acciones Operativas
              </h4>

              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange('CONFIRMED')}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Confirmar Pedido
                  </button>
                )}

                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStatusChange('PREPARING')}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Iniciar Preparación
                  </button>
                )}

                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setDeliveryCashAmount(outstandingOf(selectedOrder));
                      setShowDeliveryModal(true);
                    }}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completar Entrega
                  </button>
                )}

                {Number(outstandingOf(selectedOrder)) > 0 && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setPaymentAmount(outstandingOf(selectedOrder));
                      setShowPaymentModal(true);
                    }}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Registrar Cobro
                  </button>
                )}

                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors ml-auto cursor-pointer"
                  >
                    Cancelar Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cash Payment Register Modal */}
      {showPaymentModal && selectedOrder && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Registrar Cobro en Efectivo`}
          subtitle={`Pedido ${selectedOrder.id} (${selectedOrder.commerceName})`}
          maxWidth="md"
        >
          <form onSubmit={handleRegisterPayment} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total pedido:</span>
                <span className="font-bold">{formatMoney(selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo pendiente:</span>
                <span className="font-bold text-amber-700">{formatMoney(outstandingOf(selectedOrder))}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Importe a Cobrar (ARS) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Ej: 5000.00"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isActionLoading ? 'Registrando...' : 'Confirmar Cobro'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Delivery Modal */}
      {showDeliveryModal && selectedOrder && (
        <Modal
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          title={`Confirmar Entrega del Pedido`}
          subtitle={`Pedido ${selectedOrder.id} para ${selectedOrder.commerceName}`}
          maxWidth="md"
        >
          <form onSubmit={handleCompleteDelivery} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Al confirmar, el pedido pasará al estado <strong>ENTREGADO</strong>. Si el cliente abonó en efectivo en el acto de la entrega, ingresá el monto a continuación:
            </p>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cobro en efectivo contra entrega (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deliveryCashAmount}
                onChange={(e) => setDeliveryCashAmount(e.target.value)}
                placeholder="0.00 si no se cobra en el acto"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-teal-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Saldo pendiente actual: {formatMoney(outstandingOf(selectedOrder))}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isActionLoading ? 'Guardando...' : 'Confirmar y Finalizar Entrega'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Create Order Modal */}
      {showCreateOrderModal && (
        <AdminCreateOrderModal
          isOpen={showCreateOrderModal}
          onClose={() => setShowCreateOrderModal(false)}
          onOrderCreated={(newOrder) => {
            setOrders((prev) => [newOrder, ...prev]);
            setSelectedOrder(newOrder);
          }}
        />
      )}
    </div>
  );
};
