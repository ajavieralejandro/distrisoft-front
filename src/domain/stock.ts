import type { Product, ProductUnit } from '@/types';

export const LOW_STOCK_THRESHOLD = 10;

export type ReplenishmentRow = {
  productId: string;
  name: string;
  unit: ProductUnit;
  stock: number;
  availableStock: number;
  minimum: number;
  suggested: number | null;
  exhausted: boolean;
};

export function minimumStockOf(product: Pick<Product, 'minStock'>): number {
  return product.minStock ?? LOW_STOCK_THRESHOLD;
}

export function replenishmentList(products: Product[]): ReplenishmentRow[] {
  return products
    .filter((product) => product.active)
    .map((product) => {
      const minimum = minimumStockOf(product);
      const exhausted = product.availableStock <= 0;
      const suggested = minimum - product.availableStock;
      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        stock: product.availableStock,
        availableStock: product.availableStock,
        minimum,
        suggested: suggested > 0 ? suggested : null,
        exhausted,
      };
    })
    .filter((row) => row.exhausted || row.stock < row.minimum)
    .sort((left, right) => {
      if (left.exhausted !== right.exhausted) {
        return left.exhausted ? -1 : 1;
      }
      if (left.stock !== right.stock) {
        return left.stock - right.stock;
      }
      return left.name.localeCompare(right.name, 'es');
    });
}

export function stockCounts(products: Product[]): {
  exhausted: number;
  low: number;
} {
  const rows = replenishmentList(products);
  return {
    exhausted: rows.filter((row) => row.exhausted).length,
    low: rows.filter((row) => !row.exhausted).length,
  };
}
