import { apiRequest, getAuthToken } from '@/api/http';
import { getDefaultApiBaseUrl, getDataSourceMode } from '@/config';
import { generateIdempotencyKey } from '@/lib/crypto';
import { mockStore } from '@/services/mock-store';
import type {
  Category,
  Commerce,
  CreateOrderAdminInput,
  FinancialSummary,
  MovementItem,
  Order,
  OrderStatus,
  Product,
  StockPurchase,
} from '@/types';

function extractAmount(moneyObj: any, fallback = '0.00'): string {
  if (!moneyObj) return fallback;
  if (typeof moneyObj === 'object' && 'amount' in moneyObj) {
    return String(moneyObj.amount);
  }
  if (typeof moneyObj === 'string') return moneyObj;
  if (typeof moneyObj === 'number') return moneyObj.toFixed(2);
  return fallback;
}

function mapApiProduct(p: any): Product {
  return {
    id: p.id,
    sku: p.sku || '',
    name: p.name || '',
    description: p.description || '',
    categoryId: p.categoryId || '',
    brand: p.brand || '',
    unit: p.unit || 'UNIT',
    presentation: p.presentation || '',
    price: extractAmount(p.price, '0.00'),
    availableStock: Number(p.availableStock ?? 0),
    minStock: p.minStock ? Number(p.minStock) : undefined,
    imageUrl: p.imageUrl || undefined,
    imageColor: '#0ea5e9',
    active: Boolean(p.active),
  };
}

function mapApiCommerce(c: any): Commerce {
  return {
    id: c.id,
    businessName: c.businessName || '',
    tradeName: c.tradeName || '',
    taxId: c.taxId || '',
    status: c.status || 'ACTIVE',
    email: c.email || '',
    phone: c.phone || '',
    address: c.address || '',
    city: c.city || '',
    tags: Array.isArray(c.tags) ? c.tags : [],
    creditLimit: extractAmount(c.creditLimit, '0.00'),
    balance: extractAmount(c.balance, '0.00'),
    balanceAvailable: c.balanceAvailable ?? false,
    branches: Array.isArray(c.branches) ? c.branches : [],
  };
}

function mapApiOrder(o: any): Order {
  return {
    id: o.id,
    commerceId: o.commerceId || '',
    commerceName: o.commerceName || (o.commerce?.tradeName ?? 'Comercio'),
    status: o.status || 'PENDING',
    createdAt: o.createdAt || new Date().toISOString(),
    total: extractAmount(o.total, '0.00'),
    paidAmount: extractAmount(o.paidAmount, '0.00'),
    paymentMethod: o.paymentMethod || null,
    observations: o.observations || o.notes || null,
    delivery: o.delivery || { mode: 'PICKUP' },
    shippingCost: extractAmount(o.shippingCost, undefined),
    items: Array.isArray(o.items)
      ? o.items.map((i: any) => ({
          productId: i.productId,
          sku: i.sku || '',
          name: i.name || '',
          unit: i.unit || 'UNIT',
          unitPrice: extractAmount(i.unitPrice, '0.00'),
          quantity: Number(i.quantity ?? 1),
          lineTotal: extractAmount(i.lineTotal, '0.00'),
        }))
      : [],
  };
}

function mapApiStockPurchase(sp: any): StockPurchase {
  return {
    id: sp.id,
    productId: sp.productId,
    productName: sp.productName,
    productSku: sp.productSku,
    quantity: sp.quantity,
    unitCost: extractAmount(sp.unitCost, '0.00'),
    totalCost: extractAmount(sp.totalCost, '0.00'),
    supplierName: sp.supplierName || 'Proveedor',
    notes: sp.notes || null,
    createdAt: sp.createdAt || new Date().toISOString(),
  };
}

export const services = {
  // Categories
  async listCategories(): Promise<Category[]> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.getCategories();
    }
    const data = await apiRequest<Category[]>('/categories');
    return Array.isArray(data) ? data : [];
  },

  // Products
  async listProducts(categoryId?: string): Promise<Product[]> {
    if (getDataSourceMode() === 'demo') {
      const list = mockStore.getProducts();
      return categoryId ? list.filter((p) => p.categoryId === categoryId) : list;
    }
    const params = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    const res = await apiRequest<any>(`/products${params}`);
    const items = Array.isArray(res) ? res : res?.items || [];
    return items.map(mapApiProduct);
  },

  async getProduct(id: string): Promise<Product | null> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.getProduct(id) || null;
    }
    const res = await apiRequest<any>(`/products/${id}`);
    return res ? mapApiProduct(res) : null;
  },

  async createProduct(data: {
    sku: string;
    name: string;
    description: string;
    categoryId: string;
    brand: string;
    unit: Product['unit'];
    presentation: string;
    price: string;
    availableStock: number;
    imageUrl?: string;
    active?: boolean;
  }): Promise<Product> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.addProduct({
        ...data,
        active: data.active ?? true,
        imageColor: '#0ea5e9',
      });
    }
    const res = await apiRequest<any>('/products', {
      method: 'POST',
      body: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        brand: data.brand,
        unit: data.unit,
        presentation: data.presentation,
        price: data.price,
        availableStock: data.availableStock,
        imageUrl: data.imageUrl || undefined,
        active: data.active ?? true,
      },
    });
    return mapApiProduct(res);
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.updateProduct(id, data);
    }
    const res = await apiRequest<any>(`/products/${id}`, {
      method: 'PATCH',
      body: data,
    });
    return mapApiProduct(res);
  },

  async updateProductStock(id: string, newStock: number): Promise<Product> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.updateProduct(id, { availableStock: newStock });
    }
    const res = await apiRequest<any>(`/products/${id}`, {
      method: 'PATCH',
      body: { availableStock: newStock },
    });
    return mapApiProduct(res);
  },

  // Commerces
  async listCommerces(search?: string): Promise<Commerce[]> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.getCommerces(search);
    }
    const params = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const res = await apiRequest<any>(`/commerces${params}`);
    const items = Array.isArray(res) ? res : res?.items || [];
    return items.map(mapApiCommerce);
  },

  async getCommerce(id: string): Promise<Commerce | null> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.getCommerce(id) || null;
    }
    const res = await apiRequest<any>(`/commerces/${id}`);
    return res ? mapApiCommerce(res) : null;
  },

  async createCommerce(data: {
    tradeName: string;
    businessName?: string;
    taxId: string;
    address: string;
    city: string;
    phone?: string;
    email?: string;
    tags?: string[];
    creditLimit?: string;
    branchName?: string;
  }): Promise<Commerce> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.addCommerce({
        tradeName: data.tradeName,
        businessName: data.businessName || data.tradeName,
        taxId: data.taxId,
        address: data.address,
        city: data.city,
        phone: data.phone || '',
        email: data.email || '',
        tags: data.tags || [],
        creditLimit: data.creditLimit || '0.00',
        branchName: data.branchName,
      });
    }
    const res = await apiRequest<any>('/commerces', {
      method: 'POST',
      body: data,
    });
    return mapApiCommerce(res);
  },

  async updateCommerce(id: string, data: Partial<Commerce>): Promise<Commerce> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.updateCommerce(id, data);
    }
    const res = await apiRequest<any>(`/commerces/${id}`, {
      method: 'PATCH',
      body: data,
    });
    return mapApiCommerce(res);
  },

  // Orders
  async listOrders(filters?: {
    status?: string;
    paymentStatus?: string;
    commerceId?: string;
    search?: string;
  }): Promise<Order[]> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.getOrders(filters);
    }
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') {
      params.set('status', filters.status);
    }
    if (filters?.commerceId) {
      params.set('commerceId', filters.commerceId);
    }
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<any>(`/orders${q}`);
    const items = Array.isArray(res) ? res : res?.items || [];
    return items.map(mapApiOrder);
  },

  async getOrder(id: string): Promise<Order | null> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.getOrder(id) || null;
    }
    const res = await apiRequest<any>(`/orders/${id}`);
    return res ? mapApiOrder(res) : null;
  },

  async createOrderAsAdmin(data: CreateOrderAdminInput): Promise<Order> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.createOrder(data);
    }
    const key = generateIdempotencyKey();
    const res = await apiRequest<any>('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: {
        commerceId: data.commerceId,
        paymentMethod: data.paymentMethod,
        delivery: data.delivery,
        items: data.items,
        notes: data.notes || undefined,
      },
    });
    return mapApiOrder(res);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.updateOrderStatus(id, status);
    }
    const res = await apiRequest<any>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return mapApiOrder(res);
  },

  async registerCashPayment(orderId: string, amount: string): Promise<Order> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.registerOrderPayment(orderId, amount);
    }
    const key = generateIdempotencyKey();
    await apiRequest(`/orders/${encodeURIComponent(orderId)}/payments`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: { amount, method: 'CASH' },
    });
    const updated = await this.getOrder(orderId);
    if (!updated) throw new Error('No se pudo recuperar el pedido actualizado');
    return updated;
  },

  async completeDelivery(
    orderId: string,
    paymentAmount?: string,
  ): Promise<Order> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.completeDelivery(orderId, paymentAmount);
    }
    const key = generateIdempotencyKey();
    const body: any = {};
    if (paymentAmount && Number(paymentAmount) > 0) {
      body.payment = {
        amount: paymentAmount,
        method: 'CASH',
      };
    }
    await apiRequest(`/delivery/orders/${encodeURIComponent(orderId)}/complete`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body,
    });
    const updated = await this.getOrder(orderId);
    if (!updated) throw new Error('No se pudo recuperar el pedido actualizado');
    return updated;
  },

  // Accounting & Billing
  async getAccountingSummary(query?: {
    from?: string;
    to?: string;
    period?: string;
  }): Promise<FinancialSummary> {
    if (getDataSourceMode() === 'demo') {
      const from = query?.from ? new Date(query.from) : undefined;
      const to = query?.to ? new Date(query.to) : undefined;
      return mockStore.getAccountingSummary(from || to ? { from, to } : undefined);
    }

    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.period) params.set('period', query.period);

    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<any>(`/accounting/summary${q}`);

    return {
      period: res.period,
      totalIncomes: extractAmount(res.totalIncomes, '0.00'),
      incomesCount: res.incomesCount || 0,
      totalExpenses: extractAmount(res.totalExpenses, '0.00'),
      expensesCount: res.expensesCount || 0,
      netBalance: extractAmount(res.netBalance, '0.00'),
      outstandingReceivables: extractAmount(res.outstandingReceivables, '0.00'),
    };
  },

  async getAccountingMovements(query?: {
    from?: string;
    to?: string;
    period?: string;
  }): Promise<MovementItem[]> {
    if (getDataSourceMode() === 'demo') {
      const from = query?.from ? new Date(query.from) : undefined;
      const to = query?.to ? new Date(query.to) : undefined;
      return mockStore.getAccountingMovements(from || to ? { from, to } : undefined);
    }

    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.period) params.set('period', query.period);

    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<any[]>(`/accounting/movements${q}`);

    return (Array.isArray(res) ? res : []).map((m: any) => ({
      id: m.id,
      type: m.type,
      concept: m.concept,
      amount: extractAmount(m.amount, '0.00'),
      referenceId: m.referenceId,
      entityName: m.entityName,
      method: m.method,
      createdAt: m.createdAt,
    }));
  },

  async getStockPurchases(query?: {
    from?: string;
    to?: string;
    period?: string;
  }): Promise<StockPurchase[]> {
    if (getDataSourceMode() === 'demo') {
      const from = query?.from ? new Date(query.from) : undefined;
      const to = query?.to ? new Date(query.to) : undefined;
      return mockStore.getStockPurchases(from || to ? { from, to } : undefined);
    }

    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.period) params.set('period', query.period);

    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<any[]>(`/accounting/stock-purchases${q}`);

    return (Array.isArray(res) ? res : []).map(mapApiStockPurchase);
  },

  async createStockPurchase(data: {
    productId: string;
    quantity: number;
    unitCost: string;
    supplierName?: string;
    notes?: string;
  }): Promise<StockPurchase> {
    if (getDataSourceMode() === 'demo') {
      return mockStore.addStockPurchase(data);
    }

    const res = await apiRequest<any>('/accounting/stock-purchases', {
      method: 'POST',
      body: data,
    });
    return mapApiStockPurchase(res);
  },

  async downloadBillingPdf(query?: {
    from?: string;
    to?: string;
    period?: string;
  }): Promise<void> {
    if (getDataSourceMode() === 'demo') {
      // In demo mode, trigger alert and print friendly preview
      window.print();
      return;
    }

    const params = new URLSearchParams();
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    if (query?.period) params.set('period', query.period);

    const q = params.toString() ? `?${params.toString()}` : '';
    const baseUrl = getDefaultApiBaseUrl().replace(/\/+$/, '');
    const token = getAuthToken();

    const res = await fetch(`${baseUrl}/accounting/report/pdf${q}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!res.ok) {
      throw new Error(`Error al descargar PDF (HTTP ${res.status})`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `facturacion-distrisoft-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },
};
