import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Truck,
  X,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { formatMoney, multiplyMoney, sumMoney } from '@/lib/money';
import { services } from '@/services';
import type {
  Commerce,
  CreateOrderAdminInput,
  DeliveryMode,
  Order,
  PaymentMethod,
  Product,
} from '@/types';

type AdminCreateOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  initialCommerceId?: string;
};

export const AdminCreateOrderModal: React.FC<AdminCreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialCommerceId,
}) => {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedCommerceId, setSelectedCommerceId] = useState<string>(initialCommerceId || '');
  const [searchTermCommerce, setSearchTermCommerce] = useState('');
  const [searchTermProduct, setSearchTermProduct] = useState('');

  // Cart: Map of productId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});

  // Logistics & Payment
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('DELIVERY');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [references, setReferences] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([services.listCommerces(), services.listProducts()])
        .then(([commList, prodList]) => {
          setCommerces(commList);
          setProducts(prodList);

          if (initialCommerceId) {
            setSelectedCommerceId(initialCommerceId);
            const found = commList.find((c) => c.id === initialCommerceId);
            if (found) {
              setRecipient(found.tradeName);
              setPhone(found.phone);
              setAddress(found.address);
              setCity(found.city);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialCommerceId]);

  const handleSelectCommerce = (c: Commerce) => {
    setSelectedCommerceId(c.id);
    setRecipient(c.tradeName);
    setPhone(c.phone);
    setAddress(c.address);
    setCity(c.city);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      if (next > product.availableStock) {
        alert(`No hay más stock disponible de ${product.name} (Máximo: ${product.availableStock})`);
        return prev;
      }
      return { ...prev, [productId]: next };
    });
  };

  const selectedCommerce = commerces.find((c) => c.id === selectedCommerceId);

  // Cart items calculation
  const cartEntries = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return null;
      const lineTotal = multiplyMoney(product.price, quantity);
      return { product, quantity, lineTotal };
    })
    .filter(Boolean) as { product: Product; quantity: number; lineTotal: string }[];

  const orderTotal = sumMoney(cartEntries.map((e) => e.lineTotal));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCommerceId) {
      setError('Tenés que seleccionar un comercio cliente');
      return;
    }
    if (cartEntries.length === 0) {
      setError('Tenés que agregar al menos un producto al pedido');
      return;
    }
    if (deliveryMode === 'DELIVERY' && (!address.trim() || !city.trim())) {
      setError('Completá la dirección y localidad de entrega');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateOrderAdminInput = {
        commerceId: selectedCommerceId,
        paymentMethod,
        notes: notes.trim() || undefined,
        delivery: {
          mode: deliveryMode,
          recipient: deliveryMode === 'DELIVERY' ? recipient.trim() || undefined : undefined,
          phone: deliveryMode === 'DELIVERY' ? phone.trim() || undefined : undefined,
          address: deliveryMode === 'DELIVERY' ? address.trim() || undefined : undefined,
          city: deliveryMode === 'DELIVERY' ? city.trim() || undefined : undefined,
          references: deliveryMode === 'DELIVERY' && references.trim() ? references.trim() : undefined,
        },
        items: cartEntries.map((e) => ({
          productId: e.product.id,
          quantity: e.quantity,
        })),
      };

      const created = await services.createOrderAsAdmin(input);
      onOrderCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al emitir el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCommerces = commerces.filter((c) => {
    if (!searchTermCommerce.trim()) return true;
    const s = searchTermCommerce.toLowerCase();
    return (
      c.tradeName.toLowerCase().includes(s) ||
      c.businessName.toLowerCase().includes(s) ||
      c.taxId.includes(s)
    );
  });

  const filteredProducts = products.filter((p) => {
    if (!searchTermProduct.trim()) return true;
    const s = searchTermProduct.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Pedido Administrativo para Cliente"
      subtitle="Generá y asociá un pedido oficial en nombre de un comercio minorista"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Commerce */}
        <div className="space-y-2">
          <label className="block font-bold uppercase tracking-wider text-slate-700">
            1. Comercio Destinatario *
          </label>

          {selectedCommerce ? (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedCommerce.tradeName}
                  </span>
                  <span className="text-slate-500 ml-2">
                    (CUIT: {selectedCommerce.taxId} · {selectedCommerce.city})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommerceId('')}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar comercio por nombre o CUIT..."
                  value={searchTermCommerce}
                  onChange={(e) => setSearchTermCommerce(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {filteredCommerces.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCommerce(c)}
                    className="p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{c.tradeName}</span>
                      <span className="text-slate-400 text-[11px] ml-2 font-mono">
                        {c.taxId}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{c.city}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Add Products */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold uppercase tracking-wider text-slate-700">
              2. Selección de Productos del Catálogo *
            </label>
            <span className="text-slate-400">
              {cartEntries.length} {cartEntries.length === 1 ? 'artículo' : 'artículos'} agregados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Catalog list with search */}
            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar catálogo..."
                  value={searchTermProduct}
                  onChange={(e) => setSearchTermProduct(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                {filteredProducts.map((p) => {
                  const qtyInCart = cart[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.sku} · {formatMoney(p.price)} · Stock: {p.availableStock}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {qtyInCart > 0 && (
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, -1)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {qtyInCart > 0 && (
                          <span className="font-bold px-1 text-teal-700">{qtyInCart}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(p.id, 1)}
                          disabled={p.availableStock <= qtyInCart}
                          className="p-1 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white rounded transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Cart Summary */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-white flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">
                  Resumen de Líneas
                </span>
                {cartEntries.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Agregá productos desde la lista izquierda
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                    {cartEntries.map((e) => (
                      <div key={e.product.id} className="py-1.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{e.product.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {e.quantity} {e.product.unit.toLowerCase()} × {formatMoney(e.product.price)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">{formatMoney(e.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700">Total Pedido:</span>
                <span className="text-base font-black text-teal-700">
                  {formatMoney(orderTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Logistics & Delivery */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="font-bold uppercase tracking-wider text-slate-700 block">
            3. Datos de Despacho y Entrega
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMode('DELIVERY')}
              className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${
                deliveryMode === 'DELIVERY'
                  ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-xs'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <Truck className="w-4 h-4" />
              Envío a Domicilio
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode('PICKUP')}
              className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer ${
                deliveryMode === 'PICKUP'
                  ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-xs'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Retiro en Depósito
            </button>
          </div>

          {deliveryMode === 'DELIVERY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 mb-0.5">Destinatario / Comercio</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Dirección de Entrega *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Localidad / Ciudad *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Payment Method & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Medio de Pago Acordado
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
            >
              <option value="TRANSFER">Transferencia Bancaria</option>
              <option value="CASH">Efectivo contra entrega</option>
              <option value="CARD">Tarjeta de débito/crédito</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Observaciones / Notas
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Entregar por la mañana..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || cartEntries.length === 0}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Emitiendo Pedido...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Emitir Pedido ({formatMoney(orderTotal)})
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
