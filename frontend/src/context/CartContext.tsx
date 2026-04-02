import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import type { GuestCartItem, CartItem } from "../types";

interface CartContextValue {
  /** Combined cart items for display */
  items: DisplayCartItem[];
  /** Total number of items */
  count: number;
  /** Total price */
  total: number;
  /** Add item to cart (works for guest and logged-in) */
  addItem: (product: GuestCartItem) => Promise<void>;
  /** Update quantity */
  updateQty: (productId: number, quantity: number, itemId?: number) => Promise<void>;
  /** Remove item */
  removeItem: (productId: number, itemId?: number) => Promise<void>;
  loading: boolean;
}

export interface DisplayCartItem {
  itemId?: number; // server cart item ID (undefined for guest)
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  stockQty: number;
  sku: string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const GUEST_KEY = "guestCart";

function loadGuest(): GuestCartItem[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGuest(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>(loadGuest);
  const [serverItems, setServerItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Persist guest cart
  useEffect(() => {
    saveGuest(guestItems);
  }, [guestItems]);

  // Fetch server cart when user logs in
  const fetchServerCart = useCallback(async () => {
    if (!user) { setServerItems([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setServerItems(data);
    } catch {
      setServerItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServerCart();
  }, [fetchServerCart]);

  // Build display items
  const items: DisplayCartItem[] = user
    ? serverItems.map((s) => ({
        itemId: s.id,
        productId: s.productId,
        quantity: s.quantity,
        name: s.product.name,
        price: s.product.price,
        imageUrl: s.product.imageUrl,
        stockQty: s.product.stockQty,
        sku: s.product.sku,
      }))
    : guestItems.map((g) => ({
        productId: g.productId,
        quantity: g.quantity,
        name: g.name,
        price: g.price,
        imageUrl: g.imageUrl,
        stockQty: g.stockQty,
        sku: g.sku,
      }));

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const addItem = async (product: GuestCartItem) => {
    if (user) {
      try {
        await api.post("/cart/items", {
          productId: product.productId,
          quantity: product.quantity,
        });
        await fetchServerCart();
      } catch (err: any) {
        throw new Error(err.response?.data?.error || "Failed to add item");
      }
    } else {
      setGuestItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === product.productId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: Math.min(
              updated[idx].quantity + product.quantity,
              product.stockQty
            ),
          };
          return updated;
        }
        return [...prev, product];
      });
    }
  };

  const updateQty = async (
    productId: number,
    quantity: number,
    itemId?: number
  ) => {
    if (user && itemId) {
      try {
        await api.patch(`/cart/items/${itemId}`, { quantity });
        await fetchServerCart();
      } catch (err: any) {
        throw new Error(err.response?.data?.error || "Failed to update");
      }
    } else {
      setGuestItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
  };

  const removeItem = async (productId: number, itemId?: number) => {
    if (user && itemId) {
      try {
        await api.delete(`/cart/items/${itemId}`);
        await fetchServerCart();
      } catch {
        /* ignore */
      }
    } else {
      setGuestItems((prev) => prev.filter((i) => i.productId !== productId));
    }
  };

  return (
    <CartContext.Provider
      value={{ items, count, total, addItem, updateQty, removeItem, loading }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
