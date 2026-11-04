import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { StatCard } from '@/components/StatCard';
import { formatDateTime } from '@/lib/datetime';
import { formatMoney, multiplyMoney, sumMoney } from '@/lib/money';
import { services } from '@/services';
import type {
  Category,
  CreateBulkStockPurchasePayload,
  FinancialSummary,
  MovementItem,
  Product,
  ProductUnit,
  StockPurchase,
  StockPurchaseBatch,
} from '@/types';

type BulkLineState = {
  id: string;
  isNewProduct: boolean;
  productId: string;
  newName: string;
  newSku: string;
  newCategoryId: string;
  newBrand: string;
  newUnit: ProductUnit;
  newPresentation: string;
  newSalePrice: string;
  quantity: number;
  unitCost: string;
};

function calculateMargin(priceStr: string, costStr?: string) {
  const price = Number(priceStr);
  const cost = Number(costStr || '0');
  if (!cost || cost <= 0 || !price || price <= 0) return null;

  const margin = ((price - cost) / price) * 100;
  return {
    margin: margin.toFixed(1),
    isNegative: price < cost,
    isLow: margin < 15,
  };
}

export const AdminBillingPage: React.FC = () => {
  const [period, setPeriod] = useState<'ALL' | 'TODAY' | 'DAYS_7' | 'DAYS_30'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [purchases, setPurchases] = useState<StockPurchase[]>([]);
  const [batches, setBatches] = useState<StockPurchaseBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Active tabs
  const [activeTab, setActiveTab] = useState<'MOVEMENTS' | 'PURCHASES'>('MOVEMENTS');
  const [purchasesView, setPurchasesView] = useState<'BATCHES' | 'INDIVIDUAL'>('BATCHES');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  // Single Purchase Modal State
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

  // Bulk Purchase Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSupplierName, setBulkSupplierName] = useState('');
  const [bulkInvoiceNumber, setBulkInvoiceNumber] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkLines, setBulkLines] = useState<BulkLineState[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        period: fromDate || toDate ? undefined : period,
        from: fromDate || undefined,
        to: toDate || undefined,
      };

      const [sum, movs, purchs, bts, prods, cats] = await Promise.all([
        services.getAccountingSummary(query),
        services.getAccountingMovements(query),
        services.getStockPurchases(query),
        services.getStockPurchaseBatches(query),
        services.listProducts(undefined, true),
        services.listCategories(),
      ]);

      setSummary(sum);
      setMovements(movs);
      setPurchases(purchs);
      setBatches(bts);
      setProducts(prods);
      setCategories(cats);

      if (prods.length > 0 && !purchaseForm.productId) {
        setPurchaseForm((prev) => ({
          ...prev,
          productId: prods[0].id,
          unitCost: prods[0].costPrice || prods[0].price,
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

  const showNotice = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

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

  // Single purchase handlers
  const handleProductSelect = (productId: string) => {
    const selected = products.find((p) => p.id === productId);
    setPurchaseForm((prev) => ({
      ...prev,
      productId,
      unitCost: selected ? selected.costPrice || selected.price : prev.unitCost,
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
        unitCost: products[0]?.costPrice || products[0]?.price || '',
        supplierName: '',
        notes: '',
      });
      await loadData();
      showNotice('Compra individual registrada e inventario actualizado con éxito');
    } catch (err: any) {
      setPurchaseError(err?.message || 'Error al asentar compra de stock');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // Bulk purchase handlers
  const handleOpenBulkModal = () => {
    setBulkError(null);
    setBulkSupplierName('');
    setBulkInvoiceNumber('');
    setBulkNotes('');
    const defaultCatId = categories[0]?.id || '';
    const firstProd = products[0];

    setBulkLines([
      {
        id: `line-${Date.now()}-0`,
        isNewProduct: false,
        productId: firstProd?.id || '',
        newName: '',
        newSku: '',
        newCategoryId: defaultCatId,
        newBrand: '',
        newUnit: 'UNIT',
        newPresentation: '',
        newSalePrice: '',
        quantity: 10,
        unitCost: firstProd?.costPrice || firstProd?.price || '',
      },
    ]);
    setShowBulkModal(true);
  };

  const handleAddBulkLine = () => {
    const defaultCatId = categories[0]?.id || '';
    const firstProd = products[0];
    setBulkLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        isNewProduct: false,
        productId: firstProd?.id || '',
        newName: '',
        newSku: '',
        newCategoryId: defaultCatId,
        newBrand: '',
        newUnit: 'UNIT',
        newPresentation: '',
        newSalePrice: '',
        quantity: 10,
        unitCost: firstProd?.costPrice || firstProd?.price || '',
      },
    ]);
  };

  const handleRemoveBulkLine = (id: string) => {
    setBulkLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateBulkLine = (id: string, updates: Partial<BulkLineState>) => {
    setBulkLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };

        // If product changed, update default unitCost
        if (updates.productId && updates.productId !== l.productId) {
          const prod = products.find((p) => p.id === updates.productId);
          if (prod) {
            updated.unitCost = prod.costPrice || prod.price || '';
          }
        }
        return updated;
      }),
    );
  };

  const handleCreateBulkPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);

    if (bulkLines.length === 0) {
      setBulkError('Agregá al menos un renglón de compra.');
      return;
    }

    // Validation
    for (let i = 0; i < bulkLines.length; i++) {
      const line = bulkLines[i];
      if (line.quantity < 1) {
        setBulkError(`Renglón #${i + 1}: la cantidad debe ser mayor o igual a 1.`);
        return;
      }
      if (!line.unitCost || Number(line.unitCost) <= 0) {
        setBulkError(`Renglón #${i + 1}: ingresá un costo unitario válido.`);
        return;
      }
      if (line.isNewProduct) {
        if (!line.newName.trim()) {
          setBulkError(`Renglón #${i + 1}: completá el nombre del nuevo producto.`);
          return;
        }
        if (!line.newCategoryId) {
          setBulkError(`Renglón #${i + 1}: seleccioná una categoría.`);
          return;
        }
        if (!line.newSalePrice || Number(line.newSalePrice) <= 0) {
          setBulkError(`Renglón #${i + 1}: indicá un precio de venta mayorista.`);
          return;
        }
      } else {
        if (!line.productId) {
          setBulkError(`Renglón #${i + 1}: seleccioná un producto de catálogo.`);
          return;
        }
      }
    }

    setIsSubmittingBulk(true);
    try {
      const payload: CreateBulkStockPurchasePayload = {
        supplierName: bulkSupplierName.trim() || undefined,
        invoiceNumber: bulkInvoiceNumber.trim() || undefined,
        notes: bulkNotes.trim() || undefined,
        items: bulkLines.map((l) => ({
          productId: l.isNewProduct ? undefined : l.productId,
          newProduct: l.isNewProduct
            ? {
                name: l.newName.trim(),
                sku: l.newSku.trim() || undefined,
                categoryId: l.newCategoryId,
                brand: l.newBrand.trim() || 'General',
                unit: l.newUnit,
                presentation: l.newPresentation.trim() || 'Unidad',
                price: l.newSalePrice.trim(),
                active: false, // Default to pending approval
              }
            : undefined,
          quantity: Number(l.quantity),
          unitCost: l.unitCost.trim(),
        })),
      };

      const createdBatch = await services.createBulkStockPurchase(payload);

      setShowBulkModal(false);
      await loadData();
      showNotice(
        `¡Remito mayorista #${createdBatch.number} registrado con éxito! Se cargaron ${createdBatch.items.length} renglones de stock.`,
      );
    } catch (err: any) {
      setBulkError(err?.message || 'Error al procesar compra masiva');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Calculations for Single Modal
  const calculatedTotalCost =
    purchaseForm.unitCost && Number(purchaseForm.unitCost) > 0 && purchaseForm.quantity > 0
      ? multiplyMoney(purchaseForm.unitCost, purchaseForm.quantity)
      : '0.00';

  // Calculations for Bulk Modal
  const bulkTotalUnits = bulkLines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
  const bulkTotalCost = sumMoney(
    bulkLines.map((l) =>
      l.unitCost && Number(l.unitCost) > 0 && l.quantity > 0
        ? multiplyMoney(l.unitCost, l.quantity)
        : '0.00',
    ),
  );

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
            Ingresos por pedidos cobrados, egresos por compras masivas y balances operativos
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
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPdfDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            ) : (
              <Download className="w-4 h-4 text-teal-600" />
            )}
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={() => {
              setPurchaseError(null);
              setShowPurchaseModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Registrar una compra simple de 1 producto"
          >
            <Plus className="w-4 h-4" />
            <span>Compra Simple</span>
          </button>

          <button
            onClick={handleOpenBulkModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Compra Masiva / Remito</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'MOVEMENTS'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Movimientos Contables ({movements.length})
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
            Compras de Stock ({purchases.length})
          </button>
        </div>

        {activeTab === 'PURCHASES' && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setPurchasesView('BATCHES')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                purchasesView === 'BATCHES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Remitos / Lotes ({batches.length})</span>
            </button>
            <button
              onClick={() => setPurchasesView('INDIVIDUAL')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                purchasesView === 'INDIVIDUAL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Renglones ({purchases.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Content: Movements vs Purchases (Batches or Individual) */}
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
      ) : purchasesView === 'BATCHES' ? (
        /* Batches / Remitos View */
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Cargando comprobantes de compras...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-20 text-center px-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Sin remitos o compras por lote</h3>
              <p className="text-xs text-slate-400 mt-1">
                Hacé click en "Compra Masiva / Remito" para cargar tu primera factura de proveedor.
              </p>
            </div>
          ) : (
            batches.map((batch) => {
              const isExpanded = expandedBatchId === batch.id;
              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-bold text-sm">
                        #{batch.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">
                            Remito Mayorista #{batch.number}
                          </span>
                          {batch.invoiceNumber && (
                            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                              {batch.invoiceNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Proveedor:{' '}
                          <span className="font-semibold text-slate-700">
                            {batch.supplierName || 'Proveedor Mayorista'}
                          </span>{' '}
                          · {formatDateTime(batch.createdAt)}
                        </div>
                        {batch.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 italic">
                            "{batch.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                          Total Comprobante
                        </span>
                        <span className="text-base font-black text-rose-700">
                          -{formatMoney(batch.totalCost)}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {batch.items.length} {batch.items.length === 1 ? 'renglón' : 'renglones'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Sub-table */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <th className="py-2.5 px-3">SKU</th>
                              <th className="py-2.5 px-3">Artículo / Producto</th>
                              <th className="py-2.5 px-3 text-center">Cantidad</th>
                              <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                              <th className="py-2.5 px-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {batch.items.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px]">
                                  {item.productSku}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {item.productName}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                                  {item.quantity} un.
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-600">
                                  {formatMoney(item.unitCost)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-rose-700">
                                  -{formatMoney(item.totalCost)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Individual Purchases Table */
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

      {/* Modal: Compra Masiva / Remito Mayorista */}
      {showBulkModal && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title="Compra Masiva de Mercadería (Remito / Factura)"
          subtitle="Ingresá la cabecera del comprobante y todos los renglones adquiridos"
          maxWidth="4xl"
        >
          <form onSubmit={handleCreateBulkPurchase} className="space-y-5 text-xs">
            {bulkError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {bulkError}
              </div>
            )}

            {/* Cabecera del comprobante */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                1. Datos del Comprobante / Proveedor
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Proveedor Mayorista
                  </label>
                  <input
                    type="text"
                    value={bulkSupplierName}
                    onChange={(e) => setBulkSupplierName(e.target.value)}
                    placeholder="Ej: Distribuidora Central S.R.L."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    N° Factura / Remito
                  </label>
                  <input
                    type="text"
                    value={bulkInvoiceNumber}
                    onChange={(e) => setBulkInvoiceNumber(e.target.value)}
                    placeholder="Ej: FC-A-0001-0004521"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Observaciones / Notas
                  </label>
                  <input
                    type="text"
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder="Ej: Pago a 30 días / Mercadería en depósito"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Renglones de la compra */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  2. Renglones del Comprobante ({bulkLines.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddBulkLine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Renglón</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {bulkLines.map((line, index) => {
                  const selectedProd = products.find((p) => p.id === line.productId);
                  const salePriceToCompare = line.isNewProduct
                    ? line.newSalePrice
                    : selectedProd?.price;
                  const marginData = calculateMargin(salePriceToCompare || '0', line.unitCost);
                  const lineSubtotal =
                    line.unitCost && Number(line.unitCost) > 0 && line.quantity > 0
                      ? multiplyMoney(line.unitCost, line.quantity)
                      : '0.00';

                  return (
                    <div
                      key={line.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {line.isNewProduct ? 'Nuevo Artículo (No catalogado)' : 'Producto Existente'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateBulkLine(line.id, { isNewProduct: !line.isNewProduct })
                            }
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              line.isNewProduct
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {line.isNewProduct ? 'Cambiar a Existente' : '+ Crear Nuevo Artículo'}
                          </button>

                          {bulkLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBulkLine(line.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar este renglón"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {line.isNewProduct ? (
                        /* Campos de Producto Nuevo */
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Nombre del Artículo *
                            </label>
                            <input
                              type="text"
                              value={line.newName}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newName: e.target.value })
                              }
                              placeholder="Ej: Fideos Tirabuzón 500g"
                              required
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Categoría *
                            </label>
                            <select
                              value={line.newCategoryId}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newCategoryId: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              SKU (opcional)
                            </label>
                            <input
                              type="text"
                              value={line.newSku}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newSku: e.target.value })
                              }
                              placeholder="ALM-099"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Marca
                            </label>
                            <input
                              type="text"
                              value={line.newBrand}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newBrand: e.target.value })
                              }
                              placeholder="Ej: Matarazzo"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Presentación
                            </label>
                            <input
                              type="text"
                              value={line.newPresentation}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newPresentation: e.target.value })
                              }
                              placeholder="Paquete 500g"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Unidad de Venta
                            </label>
                            <select
                              value={line.newUnit}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newUnit: e.target.value as any })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                            >
                              <option value="UNIT">UNIT (unidad)</option>
                              <option value="PACK">PACK (pack)</option>
                              <option value="BOX">BOX (caja)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Precio Venta Mayorista ($) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={line.newSalePrice}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { newSalePrice: e.target.value })
                              }
                              placeholder="1800.00"
                              required
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Selector de Producto Existente */
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Producto de Catálogo *
                            </label>
                            <select
                              value={line.productId}
                              onChange={(e) =>
                                handleUpdateBulkLine(line.id, { productId: e.target.value })
                              }
                              required
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-500"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.sku}] {p.name} · Venta: {formatMoney(p.price)} (Stock actual: {p.availableStock})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center text-[11px]">
                            <span className="text-slate-400">Precio Mayorista Venta:</span>
                            <span className="font-bold text-slate-800 text-xs">
                              {selectedProd ? formatMoney(selectedProd.price) : '—'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Cantidad, Costo Unitario y Subtotal del Renglón */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            Cantidad Adquirida *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleUpdateBulkLine(line.id, { quantity: Number(e.target.value) })
                            }
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Costo Unitario ($) *
                            </label>
                            {marginData && (
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                  marginData.isNegative
                                    ? 'bg-rose-100 text-rose-700'
                                    : marginData.isLow
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-800'
                                }`}
                                title="Margen estimado sobre venta con este costo"
                              >
                                {marginData.isNegative ? '' : '+'}
                                {marginData.margin}% mg
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={line.unitCost}
                            onChange={(e) =>
                              handleUpdateBulkLine(line.id, { unitCost: e.target.value })
                            }
                            placeholder="850.00"
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="text-right flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Subtotal Renglón
                          </span>
                          <span className="text-sm font-black text-rose-700">
                            -{formatMoney(lineSubtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen del Comprobante / Total */}
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                  Egreso Total del Comprobante
                </span>
                <span className="text-xs text-rose-600 font-medium">
                  {bulkLines.length} renglones · {bulkTotalUnits} unidades en total
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-rose-700">
                  -{formatMoney(bulkTotalCost)}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingBulk}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingBulk ? 'Registrando Remito...' : 'Confirmar e Ingresar a Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Registrar Compra Simple de Stock (1 producto) */}
      {showPurchaseModal && (
        <Modal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          title="Registrar Compra Simple de Stock (Egreso Contable)"
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
                    [{p.sku}] {p.name} · Venta: {formatMoney(p.price)} (Stock: {p.availableStock})
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
