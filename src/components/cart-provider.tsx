"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/data";
import {
  CART_STORAGE_KEY,
  EMPTY_CART,
  addAll,
  cartCount,
  cartSubtotal,
  cartSubtotalDzd,
  itemFromProduct,
  quoteDelivery,
  setQuantity,
  smartSuggestions,
  smartTips,
  upsertItem,
  type CartItem,
  type CartState,
} from "@/lib/cart";
import { products } from "@/lib/data";

type CartProduct = Pick<Product, "slug" | "name" | "kind" | "category" | "price" | "priceDzd" | "image"> & Partial<Pick<Product, "inStock">>;

type CartContextValue = {
  items: CartItem[];
  wilaya: string;
  count: number;
  subtotal: number;
  subtotalDzd: number;
  shipping: number;
  shippingDzd: number;
  total: number;
  days: string;
  free: boolean;
  tips: ReturnType<typeof smartTips>;
  suggestions: ReturnType<typeof smartSuggestions>;
  addProduct: (product: CartProduct, quantity?: number) => void;
  addProducts: (list: Product[]) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  setWilaya: (wilaya: string) => void;
  setShippingProvider: (providerId: string) => void;
  setDeliveryMethod: (method: "home" | "stop_desk") => void;
  setPaymentMethod: (method: "cod" | "card" | "transfer") => void;
  clear: () => void;
  justAdded: string;
  shippingProvider?: string;
  deliveryMethod?: "home" | "stop_desk";
  paymentMethod?: "cod" | "card" | "transfer";
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY_CART);
  const [justAdded, setJustAdded] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setState({ ...EMPTY_CART, ...JSON.parse(raw) });
    } catch {
      setState(EMPTY_CART);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const addProduct = useCallback((product: CartProduct, quantity = 1) => {
    if (product.inStock === false) return;
    setState((current) => ({ ...current, items: upsertItem(current.items, { ...product, quantity }) }));
    setJustAdded(product.name);
    window.setTimeout(() => setJustAdded(""), 2200);
  }, []);

  const addProducts = useCallback((list: Product[]) => {
    setState((current) => ({ ...current, items: addAll(current.items, list.filter((item) => item.inStock)) }));
    setJustAdded("Solution kit");
    window.setTimeout(() => setJustAdded(""), 2200);
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    setState((current) => ({ ...current, items: setQuantity(current.items, slug, quantity) }));
  }, []);

  const remove = useCallback((slug: string) => {
    setState((current) => ({ ...current, items: current.items.filter((item) => item.slug !== slug) }));
  }, []);

  const setWilaya = useCallback((wilaya: string) => {
    setState((current) => ({ ...current, wilaya }));
  }, []);

  const setShippingProvider = useCallback((providerId: string) => {
    setState((current) => ({ ...current, shippingProvider: providerId }));
  }, []);

  const setDeliveryMethod = useCallback((method: "home" | "stop_desk") => {
    setState((current) => ({ ...current, deliveryMethod: method }));
  }, []);

  const setPaymentMethod = useCallback((method: "cod" | "card" | "transfer") => {
    setState((current) => ({ ...current, paymentMethod: method }));
  }, []);

  const clear = useCallback(() => setState((current) => ({ ...current, items: [] })), []);

  const value = useMemo(() => {
    const subtotal = cartSubtotal(state.items);
    const subtotalDzd = cartSubtotalDzd(state.items);
    
    // Use legacy calculation for now to avoid circular dependency
    // The advanced shipping calculation is handled in the cart sidebar
    const quote = quoteDelivery(state.wilaya, subtotal);
    
    return {
      items: state.items,
      wilaya: state.wilaya,
      count: cartCount(state.items),
      subtotal,
      subtotalDzd,
      shipping: quote.shipping,
      shippingDzd: quote.shippingDzd,
      total: subtotal + quote.shipping,
      days: quote.days,
      free: quote.free,
      tips: smartTips(state.items, state.wilaya),
      suggestions: smartSuggestions(state.items, products),
      addProduct,
      addProducts,
      updateQuantity,
      remove,
      setWilaya,
      setShippingProvider,
      setDeliveryMethod,
      setPaymentMethod,
      clear,
      justAdded,
      shippingProvider: state.shippingProvider,
      deliveryMethod: state.deliveryMethod,
      paymentMethod: state.paymentMethod,
    };
  }, [state, addProduct, addProducts, updateQuantity, remove, setWilaya, setShippingProvider, setDeliveryMethod, setPaymentMethod, clear, justAdded]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {justAdded && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#40533d] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgb(24_35_27_/_0.35)]">
          Added {justAdded} to your cart
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
