import {
  initialCategories,
  initialCommerces,
  initialOrders,
  initialProducts,
} from '@/mocks/fixtures';
import { STORAGE_KEYS } from '@/config';
import { addMoney, multiplyMoney, subtractMoney, sumMoney } from '@/lib/money';
import type {
  Category,
  Commerce,
  CreateOrderAdminInput,
  FinancialSummary,
  MovementItem,
  Order,
  OrderItem,
  Product,
  StockPurchase,
} from '@/types';

const STORAGE_KEY_STOCK_PURCHASES = 'distrisoft_mock_stock_purchases';

const initialStockPurchases: StockPurchase[] = [
  {
    id: 'sp-1',
    productId: 'prod-1',
    productName: 'Agua mineral sin gas',
    productSku: 'BEB-001',
    quantity: 100,
    unitCost: '850.00',
    totalCost: '85000.00',
    supplierName: 'Manantiales del Sur S.A.',
    notes: 'Factura A-0001-44589',
    createdAt: '2026-09-01T08:30:00.000Z',
  },
  {
    id: 'sp-2',
    productId: 'prod-2',
    productName: 'Gaseosa cola original',
    productSku: 'BEB-002',
    quantity: 60,
    unitCost: '1950.00',
    totalCost: '117000.00',
    supplierName: 'Embotelladora Andina',
    notes: 'Factura A-0002-12004',
    createdAt: '2026-09-03T10:15:00.000Z',
  },
  {
    id: 'sp-3',
    productId: 'prod-5',
    productName: 'Arroz largo fino 00000',
    productSku: 'ALM-002',
    quantity: 150,
    unitCost: '1350.00',
    totalCost: '202500.00',
    supplierName: 'Molinos del Plata S.R.L.',
    notes: 'Factura A-0005-99812',
    createdAt: '2026-09-05T14:00:00.000Z',
  },
];

class MockStore {
  private categories: Category[] = [...initialCategories];
  private products: Product[] = [];
  private commerces: Commerce[] = [];
  private orders: Order[] = [];
  private stockPurchases: StockPurchase[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const p = localStorage.getItem(STORAGE_KEYS.MOCK_PRODUCTS);
      this.products = p ? JSON.parse(p) : [...initialProducts];

      const c = localStorage.getItem(STORAGE_KEYS.MOCK_COMMERCES);
      this.commerces = c ? JSON.parse(c) : [...initialCommerces];

      const o = localStorage.getItem(STORAGE_KEYS.MOCK_ORDERS);
      this.orders = o ? JSON.parse(o) : [...initialOrders];

      const sp = localStorage.getItem(STORAGE_KEY_STOCK_PURCHASES);
      this.stockPurchases = sp ? JSON.parse(sp) : [...initialStockPurchases];
    } catch {
      this.products = [...initialProducts];
      this.commerces = [...initialCommerces];
      this.orders = [...initialOrders];
      this.stockPurchases = [...initialStockPurchases];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.MOCK_PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.MOCK_COMMERCES, JSON.stringify(this.commerces));
      localStorage.setItem(STORAGE_KEYS.MOCK_ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEY_STOCK_PURCHASES, JSON.stringify(this.stockPurchases));
    } catch (e) {
      console.warn('Could not save mock store to localStorage', e);
    }
  }

  reset() {
    this.categories = [...initialCategories];
    this.products = [...initialProducts];
    this.commerces = [...initialCommerces];
    this.orders = [...initialOrders];
    this.stockPurchases = [...initialStockPurchases];
    this.save();
  }

  // Categories
  getCategories(): Category[] {
    return [...this.categories];
  }

  // Products
  getProducts(): Product[] {
    return [...this.products];
  }

  getProduct(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    this.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');
    this.products[idx] = { ...this.products[idx], ...updates };
    this.save();
    return this.products[idx];
  }

  // Commerces
  getCommerces(search?: string): Commerce[] {
    if (!search?.trim()) return [...this.commerces];
    const s = search.toLowerCase();
    return this.commerces.filter(
      (c) =>
        c.tradeName.toLowerCase().includes(s) ||
        c.businessName.toLowerCase().includes(s) ||
        c.taxId.includes(s) ||
        c.city.toLowerCase().includes(s) ||
        c.tags.some((t) => t.toLowerCase().includes(s)),
    );
  }

  getCommerce(id: string): Commerce | undefined {
    return this.commerces.find((c) => c.id === id);
  }

  addCommerce(data: Omit<Commerce, 'id' | 'status' | 'balance'> & { branchName?: string }): Commerce {
    const newId = `com-${Date.now()}`;
    const branchName = data.branchName || 'Casa Central';
    const newCommerce: Commerce = {
      ...data,
      id: newId,
      status: 'ACTIVE',
      balance: '0.00',
      branches: [
        {
          id: `br-${Date.now()}`,
          commerceId: newId,
          name: branchName,
          address: data.address,
          phone: data.phone,
        },
      ],
    };
    this.commerces.unshift(newCommerce);
    this.save();
    return newCommerce;
  }

  updateCommerce(id: string, updates: Partial<Commerce>): Commerce {
    const idx = this.commerces.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Comercio no encontrado');
    this.commerces[idx] = { ...this.commerces[idx], ...updates };
    this.save();
    return this.commerces[idx];
  }

  // Orders
  getOrders(filters?: { status?: string; paymentStatus?: string; search?: string }): Order[] {
    let list = [...this.orders];
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.commerceName.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrder(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  createOrder(input: CreateOrderAdminInput): Order {
    const commerce = this.getCommerce(input.commerceId);
    if (!commerce) throw new Error('Comercio no encontrado');
    if (commerce.status !== 'ACTIVE') throw new Error('El comercio está inactivo');

    // Build lines
    let totalCents = 0;
    const items: OrderItem[] = input.items.map((it) => {
      const product = this.getProduct(it.productId);
      if (!product) throw new Error(`Producto ${it.productId} no encontrado`);
      if (it.quantity > product.availableStock) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }
      const lineTotal = multiplyMoney(product.price, it.quantity);
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity: it.quantity,
        lineTotal,
      };
    });

    const total = sumMoney(items.map((i) => i.lineTotal));

    const newOrder: Order = {
      id: `PED-${1000 + this.orders.length + 1}`,
      commerceId: commerce.id,
      commerceName: commerce.tradeName,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      items,
      total,
      paidAmount: '0.00',
      paymentMethod: input.paymentMethod,
      observations: input.notes || null,
      delivery: input.delivery,
    };

    this.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(id: string, status: Order['status']): Order {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Pedido no encontrado');
    this.orders[idx] = { ...this.orders[idx], status };
    this.save();
    return this.orders[idx];
  }

  registerOrderPayment(id: string, amount: string): Order {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Pedido no encontrado');
    const order = this.orders[idx];
    const currentPaid = Number(order.paidAmount || '0');
    const additional = Number(amount || '0');
    const newPaid = (currentPaid + additional).toFixed(2);

    this.orders[idx] = {
      ...order,
      paidAmount: newPaid,
      paymentMethod: order.paymentMethod || 'CASH',
    };
    this.save();
    return this.orders[idx];
  }

  completeDelivery(id: string, paymentAmount?: string): Order {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Pedido no encontrado');
    const order = this.orders[idx];

    let paidAmount = order.paidAmount;
    if (paymentAmount && Number(paymentAmount) > 0) {
      const currentPaid = Number(order.paidAmount || '0');
      paidAmount = (currentPaid + Number(paymentAmount)).toFixed(2);
    }

    this.orders[idx] = {
      ...order,
      status: 'DELIVERED',
      paidAmount,
    };
    this.save();
    return this.orders[idx];
  }

  // Stock Purchases & Accounting
  getStockPurchases(dateFilter?: { from?: Date; to?: Date }): StockPurchase[] {
    let list = [...this.stockPurchases];
    if (dateFilter?.from) {
      list = list.filter((p) => new Date(p.createdAt) >= dateFilter.from!);
    }
    if (dateFilter?.to) {
      list = list.filter((p) => new Date(p.createdAt) <= dateFilter.to!);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addStockPurchase(data: {
    productId: string;
    quantity: number;
    unitCost: string;
    supplierName?: string;
    notes?: string;
  }): StockPurchase {
    const product = this.getProduct(data.productId);
    if (!product) throw new Error('Producto no encontrado');

    const totalCost = multiplyMoney(data.unitCost, data.quantity);
    const purchase: StockPurchase = {
      id: `sp-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: data.quantity,
      unitCost: data.unitCost,
      totalCost,
      supplierName: data.supplierName || 'Proveedor Mayorista',
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
    };

    this.stockPurchases.unshift(purchase);

    // Increment available stock
    this.updateProduct(product.id, {
      availableStock: product.availableStock + data.quantity,
    });

    this.save();
    return purchase;
  }

  getAccountingSummary(filter?: { from?: Date; to?: Date }): FinancialSummary {
    // Incomes from paid amounts of orders
    const relevantOrders = this.orders.filter((o) => {
      if (filter?.from && new Date(o.createdAt) < filter.from) return false;
      if (filter?.to && new Date(o.createdAt) > filter.to) return false;
      return true;
    });

    const incomesList = relevantOrders
      .map((o) => o.paidAmount)
      .filter((p) => Number(p) > 0);

    const totalIncomes = sumMoney(incomesList);
    const incomesCount = incomesList.length;

    // Expenses from stock purchases
    const purchases = this.getStockPurchases(filter);
    const totalExpenses = sumMoney(purchases.map((p) => p.totalCost));
    const expensesCount = purchases.length;

    // Net balance
    const netBalance = subtractMoney(totalIncomes, totalExpenses);

    // Receivables
    const activeOrders = this.orders.filter((o) => o.status !== 'CANCELLED');
    const outstandingList = activeOrders.map((o) => subtractMoney(o.total, o.paidAmount));
    const outstandingReceivables = sumMoney(outstandingList);

    return {
      period: {
        from: filter?.from ? filter.from.toISOString() : null,
        to: filter?.to ? filter.to.toISOString() : null,
      },
      totalIncomes,
      incomesCount,
      totalExpenses,
      expensesCount,
      netBalance,
      outstandingReceivables,
    };
  }

  getAccountingMovements(filter?: { from?: Date; to?: Date }): MovementItem[] {
    const movements: MovementItem[] = [];

    // Incomes from orders with payment
    for (const o of this.orders) {
      if (Number(o.paidAmount) > 0) {
        if (filter?.from && new Date(o.createdAt) < filter.from) continue;
        if (filter?.to && new Date(o.createdAt) > filter.to) continue;

        movements.push({
          id: `mov-pay-${o.id}`,
          type: 'INCOME',
          concept: `Cobro Pedido #${o.id}`,
          amount: o.paidAmount,
          referenceId: o.id,
          entityName: o.commerceName,
          method: o.paymentMethod || 'CASH',
          createdAt: o.createdAt,
        });
      }
    }

    // Expenses from stock purchases
    for (const sp of this.stockPurchases) {
      if (filter?.from && new Date(sp.createdAt) < filter.from) continue;
      if (filter?.to && new Date(sp.createdAt) > filter.to) continue;

      movements.push({
        id: sp.id,
        type: 'EXPENSE',
        concept: `Compra de Stock (${sp.quantity} un. ${sp.productName})`,
        amount: sp.totalCost,
        referenceId: sp.id,
        entityName: sp.supplierName || 'Proveedor',
        createdAt: sp.createdAt,
      });
    }

    return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const mockStore = new MockStore();
