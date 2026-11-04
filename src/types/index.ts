export type AppProfile = 'ADMIN' | 'COMMERCE';

export type ProductUnit = 'UNIT' | 'PACK' | 'BOX';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export type DeliveryMode = 'PICKUP' | 'DELIVERY';

export type CommerceStatus = 'ACTIVE' | 'INACTIVE';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERED'
  | 'CANCELLED';

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  unit: ProductUnit;
  presentation: string;
  price: string;
  costPrice?: string;
  availableStock: number;
  minStock?: number;
  imageUrl?: string;
  imageColor: string;
  active: boolean;
};

export type CommerceBranch = {
  id: string;
  commerceId: string;
  name: string;
  address: string;
  phone: string;
};

export type Commerce = {
  id: string;
  businessName: string;
  tradeName: string;
  taxId: string;
  status: CommerceStatus;
  email: string;
  phone: string;
  address: string;
  city: string;
  tags: string[];
  creditLimit: string;
  balance?: string;
  balanceAvailable?: boolean;
  branches?: CommerceBranch[];
};

export type OrderItem = {
  productId: string;
  sku: string;
  name: string;
  unit: ProductUnit;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

export type DeliverySnapshot = {
  mode: DeliveryMode;
  recipient?: string;
  phone?: string;
  address?: string;
  city?: string;
  references?: string;
};

export type Order = {
  id: string;
  orderNumber?: string;
  commerceId: string;
  commerceName: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  total: string;
  paidAmount: string;
  paymentMethod?: PaymentMethod | null;
  observations?: string | null;
  delivery: DeliverySnapshot;
  shippingCost?: string;
};

export type StockPurchase = {
  id: string;
  batchId?: string | null;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: string;
  totalCost: string;
  supplierName?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type StockPurchaseBatch = {
  id: string;
  number: number;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  totalCost: string;
  createdAt: string;
  items: StockPurchase[];
};

export type InlineNewProductInput = {
  name: string;
  sku?: string;
  categoryId: string;
  brand: string;
  unit: ProductUnit;
  presentation: string;
  price: string;
  active?: boolean;
};

export type BulkPurchaseItemInput = {
  productId?: string;
  newProduct?: InlineNewProductInput;
  quantity: number;
  unitCost: string;
};

export type CreateBulkStockPurchasePayload = {
  supplierName?: string;
  invoiceNumber?: string;
  notes?: string;
  items: BulkPurchaseItemInput[];
};

export type FinancialSummary = {
  period: { from: string | null; to: string | null };
  totalIncomes: string;
  incomesCount: number;
  totalExpenses: string;
  expensesCount: number;
  netBalance: string;
  outstandingReceivables: string;
};

export type MovementItem = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  concept: string;
  amount: string;
  referenceId: string;
  entityName: string;
  method?: string;
  createdAt: string;
};

export type CreateOrderAdminInput = {
  commerceId: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  delivery: DeliverySnapshot;
  items: { productId: string; quantity: number }[];
};

export type SessionUser = {
  userId: string;
  email: string;
  displayName: string;
  profile: AppProfile;
  commerceId?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
