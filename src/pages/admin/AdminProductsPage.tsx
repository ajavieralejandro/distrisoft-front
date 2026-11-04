import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit,
  Filter,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { StockBadge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { formatMoney } from '@/lib/money';
import { services } from '@/services';
import type { Category, Product, ProductUnit } from '@/types';

function calculateMargin(priceStr: string, costStr?: string) {
  const price = Number(priceStr);
  const cost = Number(costStr || '0');
  if (!cost || cost <= 0 || !price || price <= 0) return null;

  const margin = ((price - cost) / price) * 100;
  const markup = ((price - cost) / cost) * 100;

  return {
    margin: margin.toFixed(1),
    markup: markup.toFixed(1),
    isNegative: price < cost,
    isLow: margin < 15,
    isGood: margin >= 30,
  };
}

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'EXHAUSTED' | 'LOW' | 'NORMAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Stock edit state
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [newCostPriceValue, setNewCostPriceValue] = useState<string>('');
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);

  // Success message toast/banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Add Product form state
  const [addForm, setAddForm] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    brand: '',
    unit: 'UNIT' as ProductUnit,
    presentation: '',
    price: '',
    costPrice: '',
    availableStock: 50,
    imageUrl: '',
    active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        services.listCategories(),
        services.listProducts(undefined, true),
      ]);
      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0 && !addForm.categoryId) {
        setAddForm((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar inventario de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingCount = products.filter((p) => !p.active).length;

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
      return false;
    }
    if (stockFilter === 'EXHAUSTED' && p.availableStock > 0) {
      return false;
    }
    if (stockFilter === 'LOW' && (p.availableStock <= 0 || p.availableStock > 10)) {
      return false;
    }
    if (stockFilter === 'NORMAL' && p.availableStock <= 10) {
      return false;
    }
    if (statusFilter === 'ACTIVE' && !p.active) {
      return false;
    }
    if (statusFilter === 'PENDING' && p.active) {
      return false;
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchName = p.name.toLowerCase().includes(s);
      const matchSku = p.sku.toLowerCase().includes(s);
      const matchBrand = p.brand.toLowerCase().includes(s);
      if (!matchName && !matchSku && !matchBrand) return false;
    }
    return true;
  });

  const handleOpenStockModal = (p: Product) => {
    setStockModalProduct(p);
    setNewStockValue(p.availableStock);
    setNewCostPriceValue(p.costPrice || '');
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    setIsStockSubmitting(true);
    try {
      const updated = await services.updateProductStock(
        stockModalProduct.id,
        Number(newStockValue),
        newCostPriceValue.trim() || undefined,
      );
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setStockModalProduct(null);
      showNotice(`Stock actualizado para ${updated.name}`);
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar stock');
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const updated = await services.updateProduct(p.id, { active: !p.active });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showNotice(
        updated.active
          ? `Producto "${updated.name}" publicado en catálogo`
          : `Producto "${updated.name}" pausado`,
      );
    } catch (err: any) {
      alert(err?.message || 'Error al modificar estado activo');
    }
  };

  const handleApproveProduct = async (p: Product) => {
    try {
      const updated = await services.updateProduct(p.id, { active: true });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showNotice(`¡Producto "${updated.name}" aprobado y publicado con éxito!`);
    } catch (err: any) {
      alert(err?.message || 'Error al aprobar producto');
    }
  };

  const showNotice = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!addForm.sku.trim() || !addForm.name.trim() || !addForm.price.trim()) {
      setFormError('Por favor completá SKU, nombre y precio del producto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await services.createProduct({
        ...addForm,
        price: addForm.price.trim(),
        costPrice: addForm.costPrice.trim() || undefined,
        availableStock: Number(addForm.availableStock),
      });
      setProducts((prev) => [created, ...prev]);
      setShowAddModal(false);
      setAddForm({
        sku: '',
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        brand: '',
        unit: 'UNIT',
        presentation: '',
        price: '',
        costPrice: '',
        availableStock: 50,
        imageUrl: '',
        active: true,
      });
      showNotice(`Producto "${created.name}" creado correctamente`);
    } catch (err: any) {
      setFormError(err?.message || 'Error al crear producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const updated = await services.updateProduct(editProduct.id, {
        name: editProduct.name,
        brand: editProduct.brand,
        presentation: editProduct.presentation,
        price: editProduct.price,
        costPrice: editProduct.costPrice || undefined,
        description: editProduct.description,
        imageUrl: editProduct.imageUrl,
        unit: editProduct.unit,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditProduct(null);
      showNotice(`Cambios guardados en "${updated.name}"`);
    } catch (err: any) {
      setFormError(err?.message || 'Error al actualizar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Product Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Supervisión de Catálogo y Stock
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ajuste de existencias, costos, precios mayoristas y aprobación de artículos
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadData}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs cursor-pointer"
            title="Actualizar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Todas las Categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs & Stock Level Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
              Catálogo:
            </span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Publicados ({products.filter((p) => p.active).length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Pendientes</span>
              {pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === 'PENDING'
                      ? 'bg-white text-amber-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Stock:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Todo el inventario</option>
              <option value="EXHAUSTED">Solo Agotados (0)</option>
              <option value="LOW">Stock Bajo (&le; 10)</option>
              <option value="NORMAL">Stock Normal (&gt; 10)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por SKU, nombre o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
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

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Cargando catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron productos</h3>
            <p className="text-xs text-slate-400 mt-1">
              Modificá los filtros de búsqueda o agregá nuevos productos al catálogo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">SKU / Marca</th>
                  <th className="py-3 px-4">Presentación</th>
                  <th className="py-3 px-4">Precio / Costo</th>
                  <th className="py-3 px-4">Stock Disponible</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((p) => {
                  const marginData = calculateMargin(p.price, p.costPrice);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !p.active ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs"
                              style={{ backgroundColor: p.imageColor || '#0ea5e9' }}
                            >
                              <Package className="w-5 h-5 opacity-90" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{p.name}</span>
                              {!p.active && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
                                  Pendiente
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-800 font-bold">
                          {p.sku}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.brand}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.presentation || '—'}
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {p.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-sm">
                          {formatMoney(p.price)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-medium">
                            Costo:{' '}
                            {p.costPrice && Number(p.costPrice) > 0
                              ? formatMoney(p.costPrice)
                              : '—'}
                          </span>
                          {marginData && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                marginData.isNegative
                                  ? 'bg-rose-100 text-rose-700'
                                  : marginData.isLow
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-800'
                              }`}
                              title={`Margen: ${marginData.margin}% | Markup sobre costo: +${marginData.markup}%`}
                            >
                              {marginData.isNegative ? '' : '+'}
                              {marginData.margin}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StockBadge stock={p.availableStock} minStock={p.minStock} />
                      </td>
                      <td className="py-3.5 px-4">
                        {!p.active ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleApproveProduct(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Aprobar y publicar producto en catálogo"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleToggleActive(p)}
                              className="text-[11px] text-slate-400 hover:text-slate-600 px-1 py-1"
                              title="Pausar o mantener inactivo"
                            >
                              Pausado
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            title="Click para pausar producto"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Publicado
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenStockModal(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                            title="Actualizar Stock y Costo"
                          >
                            Stock
                          </button>
                          <button
                            onClick={() => {
                              setEditProduct({ ...p });
                              setFormError(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Producto, Precio y Costo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {stockModalProduct && (
        <Modal
          isOpen={Boolean(stockModalProduct)}
          onClose={() => setStockModalProduct(null)}
          title={`Actualizar Stock: ${stockModalProduct.name}`}
          subtitle={`SKU: ${stockModalProduct.sku} · Unidad: ${stockModalProduct.unit}`}
          maxWidth="sm"
        >
          <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-slate-500 block mb-1">Stock disponible actual</span>
              <span className="text-2xl font-black text-slate-900">
                {stockModalProduct.availableStock}
              </span>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nuevo Stock Disponible *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewStockValue((prev) => Math.max(0, prev - 10))}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setNewStockValue((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="0"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(Number(e.target.value))}
                  required
                  className="w-full text-center px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold focus:outline-none focus:border-teal-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setNewStockValue((prev) => prev + 1)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setNewStockValue((prev) => prev + 10)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  +10
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Costo Unitario de Reposición (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={stockModalProduct.costPrice || '0.00'}
                value={newCostPriceValue}
                onChange={(e) => setNewCostPriceValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Actualiza el costo unitario de compra en el catálogo.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                className="px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isStockSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isStockSubmitting ? 'Guardando...' : 'Confirmar Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Alta de Producto Mayorista"
          subtitle="Completá la información del nuevo artículo en catálogo"
          maxWidth="2xl"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Ej: Harina 000"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Código SKU *
                </label>
                <input
                  type="text"
                  value={addForm.sku}
                  onChange={(e) => setAddForm({ ...addForm, sku: e.target.value })}
                  placeholder="ALM-009"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={addForm.categoryId}
                  onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={addForm.brand}
                  onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                  placeholder="Ej: Pureza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Unidad de Venta
                </label>
                <select
                  value={addForm.unit}
                  onChange={(e) => setAddForm({ ...addForm, unit: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  <option value="UNIT">Unidad individual (UNIT)</option>
                  <option value="PACK">Pack (PACK)</option>
                  <option value="BOX">Caja cerrada (BOX)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Presentación
                </label>
                <input
                  type="text"
                  value={addForm.presentation}
                  onChange={(e) => setAddForm({ ...addForm, presentation: e.target.value })}
                  placeholder="Paquete 1 kg / Pack x 6"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Precio Mayorista Venta (ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                  placeholder="1250.00"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Costo de Compra (ARS) (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addForm.costPrice}
                  onChange={(e) => setAddForm({ ...addForm, costPrice: e.target.value })}
                  placeholder="850.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Stock Inicial Disponible *
                </label>
                <input
                  type="number"
                  min="0"
                  value={addForm.availableStock}
                  onChange={(e) => setAddForm({ ...addForm, availableStock: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                URL de Imagen (opcional)
              </label>
              <input
                type="url"
                value={addForm.imageUrl}
                onChange={(e) => setAddForm({ ...addForm, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="Descripción para el catálogo mayorista..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Product & Photo Modal */}
      {editProduct && (
        <Modal
          isOpen={Boolean(editProduct)}
          onClose={() => setEditProduct(null)}
          title={`Editar Producto: ${editProduct.name}`}
          subtitle={`SKU: ${editProduct.sku}`}
          maxWidth="xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={editProduct.brand}
                  onChange={(e) => setEditProduct({ ...editProduct, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Precio Mayorista (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Costo de Compra (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editProduct.costPrice || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, costPrice: e.target.value })}
                  placeholder="850.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Presentación
                </label>
                <input
                  type="text"
                  value={editProduct.presentation}
                  onChange={(e) => setEditProduct({ ...editProduct, presentation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Photo / Image URL and Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold uppercase tracking-wider text-slate-700">
                Foto del Producto (URL)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={editProduct.imageUrl || ''}
                  onChange={(e) => setEditProduct({ ...editProduct, imageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              {editProduct.imageUrl && (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={editProduct.imageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[11px] text-slate-500">
                    Vista previa de la imagen cargada
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={editProduct.description}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
