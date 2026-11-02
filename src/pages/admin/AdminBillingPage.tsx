import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { StatCard } from '@/components/StatCard';
import { formatDateTime } from '@/lib/datetime';
import { formatMoney, multiplyMoney } from '@/lib/money';
import { services } from '@/services';
import type {
  FinancialSummary,
  MovementItem,
  Product,
  StockPurchase,
} from '@/types';

export const AdminBillingPage: React.FC = () => {
  const [period, setPeriod] = useState<'ALL' | 'TODAY' | 'DAYS_7' | 'DAYS_30'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [purchases, setPurchases] = useState<StockPurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'MOVEMENTS' | 'PURCHASES'>('MOVEMENTS');

  // Purchase Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    productId: '',
    quantity: 10,
    unitCost: '',
    supplierName: '',
    notes: '',
  });
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        period: fromDate || toDate ? undefined : period,
        from: fromDate || undefined,
        to: toDate || undefined,
      };

      const [sum, movs, purchs, prods] = await Promise.all([
        services.getAccountingSummary(query),
        services.getAccountingMovements(query),
        services.getStockPurchases(query),
        services.listProducts(),
      ]);

      setSummary(sum);
      setMovements(movs);
      setPurchases(purchs);
      setProducts(prods);

      if (prods.length > 0 && !purchaseForm.productId) {
        setPurchaseForm((prev) => ({
          ...prev,
          productId: prods[0].id,
          unitCost: prods[0].price,
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar módulo de facturación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, fromDate, toDate]);

  const handleDownloadPdf = async () => {
    setIsPdfDownloading(true);
    try {
      await services.downloadBillingPdf({
        period: fromDate || toDate ? undefined : period,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
    } catch (err: any) {
      alert(err?.message || 'Error al descargar PDF');
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const selected = products.find((p) => p.id === productId);
    setPurchaseForm((prev) => ({
      ...prev,
      productId,
      unitCost: selected ? selected.price : prev.unitCost,
    }));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);

    if (!purchaseForm.productId) {
      setPurchaseError('Seleccioná un producto de catálogo');
      return;
    }
    if (!purchaseForm.unitCost || Number(purchaseForm.unitCost) <= 0) {
      setPurchaseError('Ingresá un costo unitario válido');
      return;
    }
    if (purchaseForm.quantity < 1) {
      setPurchaseError('La cantidad mínima es 1 unidad');
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      await services.createStockPurchase({
        productId: purchaseForm.productId,
        quantity: Number(purchaseForm.quantity),
        unitCost: purchaseForm.unitCost.trim(),
        supplierName: purchaseForm.supplierName.trim() || undefined,
        notes: purchaseForm.notes.trim() || undefined,
      });

      setShowPurchaseModal(false);
      setPurchaseForm({
        productId: products[0]?.id || '',
        quantity: 10,
        unitCost: products[0]?.price || '',
        supplierName: '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      setPurchaseError(err?.message || 'Error al asentar compra de stock');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const calculatedTotalCost =
    purchaseForm.unitCost && Number(purchaseForm.unitCost) > 0 && purchaseForm.quantity > 0
      ? multiplyMoney(purchaseForm.unitCost, purchaseForm.quantity)
      : '0.00';

  const isNetPositive = summary && !summary.netBalance.startsWith('-');

  return (
    <div className="space-y-8">
      {/* Header and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Módulo de Facturación y Contabilidad
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ingresos por pedidos cobrados, egresos por compras de stock y balances operativos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={loadData}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs cursor-pointer"
            title="Refrescar datos contables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isPdfDownloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPdfDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            ) : (
              <Download className="w-4 h-4 text-teal-600" />
            )}
            <span>Descargar Facturación (PDF)</span>
          </button>

          <button
            onClick={() => {
              setPurchaseError(null);
              setShowPurchaseModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra de Stock (Egreso)</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Quick Period Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'Todo el Historial' },
            { id: 'TODAY', label: 'Hoy' },
            { id: 'DAYS_7', label: 'Últimos 7 días' },
            { id: 'DAYS_30', label: 'Últimos 30 días' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFromDate('');
                setToDate('');
                setPeriod(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                period === tab.id && !fromDate && !toDate
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-semibold">Desde:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
          />
          <span className="text-slate-500 font-semibold">Hasta:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Limpiar fechas"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Ingresos (Cobros)"
            value={formatMoney(summary.totalIncomes)}
            subtitle={`${summary.incomesCount} cobros de pedidos registrados`}
            icon={<ArrowUpRight className="w-6 h-6 text-emerald-600" />}
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Total Egresos (Stock)"
            value={formatMoney(summary.totalExpenses)}
            subtitle={`${summary.expensesCount} compras de reposición asentadas`}
            icon={<ArrowDownRight className="w-6 h-6 text-rose-600" />}
            iconBg="bg-rose-50"
          />
          <StatCard
            title="Resultado Neto"
            value={formatMoney(summary.netBalance)}
            subtitle={isNetPositive ? 'Superávit operativo de caja' : 'Déficit operativo temporal'}
            icon={
              isNetPositive ? (
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-600" />
              )
            }
            iconBg={isNetPositive ? 'bg-emerald-50' : 'bg-rose-50'}
          />
          <StatCard
            title="Cuentas por Cobrar"
            value={formatMoney(summary.outstandingReceivables)}
            subtitle="Saldo adeudado por clientes"
            icon={<Receipt className="w-6 h-6 text-amber-600" />}
            iconBg="bg-amber-50"
          />
        </div>
      )}

      {/* Sub-tabs Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'MOVEMENTS'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Movimientos Contables Unificados ({movements.length})
        </button>
        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'PURCHASES'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Compras de Stock / Proveedores ({purchases.length})
        </button>
      </div>

      {/* Table: Movements vs Purchases */}
      {activeTab === 'MOVEMENTS' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Cargando libro contable...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-20 text-center px-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Sin movimientos en este período</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajustá el rango de fechas o registrá un nuevo cobro o compra de stock.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Concepto / Comprobante</th>
                    <th className="py-3 px-4">Entidad / Cliente / Proveedor</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {movements.map((m) => {
                    const isIncome = m.type === 'INCOME';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isIncome
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {isIncome ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {m.concept}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.entityName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {m.method || '—'}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-black text-sm whitespace-nowrap ${
                            isIncome ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatMoney(m.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Cargando compras de reposición...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Sin compras registradas</h3>
              <p className="text-xs text-slate-400 mt-1">
                Registrá una compra de mercadería para sumar egresos y actualizar el stock.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">SKU / Producto</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Costo Unitario</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Notas / Factura</th>
                    <th className="py-3 px-4 text-right">Total Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                          {p.productSku}
                        </span>
                        <div className="font-bold text-slate-900 mt-0.5">{p.productName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {p.quantity} unidades
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatMoney(p.unitCost)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.supplierName || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-700 text-sm">
                        -{formatMoney(p.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Registrar Compra de Stock (Egreso) */}
      {showPurchaseModal && (
        <Modal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          title="Registrar Compra de Stock (Egreso Contable)"
          subtitle="Suma el costo a los egresos contables e incrementa el inventario disponible"
          maxWidth="xl"
        >
          <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
            {purchaseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {purchaseError}
              </div>
            )}

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Producto a Reponer *
              </label>
              <select
                value={purchaseForm.productId}
                onChange={(e) => handleProductSelect(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-teal-500 focus:bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} (Stock actual: {p.availableStock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cantidad Adquirida *
                </label>
                <input
                  type="number"
                  min="1"
                  max="99999"
                  value={purchaseForm.quantity}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Costo Unitario de Compra (ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={purchaseForm.unitCost}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, unitCost: e.target.value })
                  }
                  placeholder="850.00"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 uppercase block">
                  Egreso Total a Asentar
                </span>
                <span className="text-xs text-rose-600">
                  {purchaseForm.quantity} un. × {formatMoney(purchaseForm.unitCost || '0')}
                </span>
              </div>
              <span className="text-xl font-black text-rose-700">
                {formatMoney(calculatedTotalCost)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Proveedor / Distribuidor
                </label>
                <input
                  type="text"
                  value={purchaseForm.supplierName}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })
                  }
                  placeholder="Ej: Distribuidora Central"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  N° Factura / Comprobante
                </label>
                <input
                  type="text"
                  value={purchaseForm.notes}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, notes: e.target.value })
                  }
                  placeholder="Ej: Factura A-0001-44589"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingPurchase}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isSubmittingPurchase ? 'Asentando...' : 'Asentar Egreso y Sumar Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
