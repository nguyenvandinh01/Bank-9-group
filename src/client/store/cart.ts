import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: number;
  productSlug: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  imageUrl: string | null;
  available: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: number, qty: number) => void;
  removeItem: (variantId: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((entry) => entry.variantId === item.variantId);
          const maxQty = Math.min(10, Math.max(0, item.available));
          if (maxQty === 0) return state;
          if (!existing) {
            return { items: [...state.items, { ...item, qty: Math.min(qty, maxQty) }] };
          }
          return {
            items: state.items.map((entry) =>
              entry.variantId === item.variantId
                ? {
                    ...entry,
                    ...item,
                    qty: Math.min(10, maxQty, entry.qty + qty),
                  }
                : entry,
            ),
          };
        }),
      setQty: (variantId, qty) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.variantId === variantId
              ? { ...entry, qty: Math.max(1, Math.min(10, qty, entry.available || 10)) }
              : entry,
          ),
        })),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.variantId !== variantId),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "bank9-cart" },
  ),
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
