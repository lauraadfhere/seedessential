import { products, type Product } from "@/lib/data";

export const CART_STORAGE_KEY = "tannelli_cart";
export const ORDERS_STORAGE_KEY = "tannelli_orders";

export type CartItem = {
  slug: string;
  name: string;
  kind: "plant" | "equipment";
  category: string;
  price: number;
  priceDzd?: number;
  image?: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  wilaya: string;
  shippingProvider?: string;
  deliveryMethod?: "home" | "stop_desk";
  paymentMethod?: "cod" | "card" | "transfer";
};

export type SmartTip = {
  id: string;
  title: string;
  text: string;
  href?: string;
};

export type SmartSuggestion = {
  product: Product;
  reason: string;
};

export type OrderDeliveryStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "out_for_delivery"
  | "delivered";

export type SavedOrder = {
  id: string;
  createdAt: string;
  wilaya: string;
  address?: string;
  phone?: string;
  notes?: string;
  paymentMethod?: "cod" | "card" | "transfer";
  status: OrderDeliveryStatus;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingDzd: number;
  totalDzd: number;
  days: string;
  shippingProvider?: string;
  deliveryMethod?: "home" | "stop_desk";
};

export const ORDER_STATUS_STEPS: { id: OrderDeliveryStatus; label: string }[] = [
  { id: "placed", label: "Order placed" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
];

export function orderStatusIndex(status: OrderDeliveryStatus) {
  return Math.max(0, ORDER_STATUS_STEPS.findIndex((step) => step.id === status));
}

export const EMPTY_CART: CartState = { 
  items: [], 
  wilaya: "Alger",
  shippingProvider: "yalidine",
  deliveryMethod: "home",
  paymentMethod: "cod"
};

const FAST_WILAYAS = new Set(["Alger", "Blida", "Boumerdès", "Tipaza", "Oran", "Constantine", "Annaba", "Bouira"]);

const COMPANIONS: { slug: string; categories: string[]; reason: string }[] = [
  { slug: "organic-potting-mix", categories: ["indoor-plants", "outdoor-plants", "seeds", "herbs", "vegetables", "succulents", "flowers"], reason: "Fresh mix so roots settle after delivery." },
  { slug: "terracotta-planter-set", categories: ["indoor-plants", "succulents", "herbs", "flowers"], reason: "Breathable pots sized for indoor growers." },
  { slug: "organic-fertilizer", categories: ["indoor-plants", "outdoor-plants", "trees", "fruit-trees", "vegetables", "herbs", "seeds"], reason: "Gentle feed for the first weeks in Algeria." },
  { slug: "drip-irrigation-kit", categories: ["outdoor-plants", "trees", "fruit-trees", "vegetables", "climbing-plants"], reason: "Saves water on balconies and gardens in dry wilayas." },
  { slug: "grow-light-panel", categories: ["indoor-plants", "seeds", "herbs"], reason: "Keeps indoor plants growing through shorter winter days." },
  { slug: "pruning-shears", categories: ["trees", "fruit-trees", "climbing-plants", "outdoor-plants"], reason: "Clean cuts for trees and climbing plants." },
];

export function itemFromProduct(product: Product, quantity = 1): CartItem {
  return {
    slug: product.slug,
    name: product.name,
    kind: product.kind,
    category: product.category,
    price: product.price,
    priceDzd: product.priceDzd,
    image: product.image,
    quantity,
  };
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartSubtotalDzd(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (item.priceDzd ?? item.price * 135) * item.quantity, 0);
}

export function quoteDelivery(wilaya: string, subtotal: number) {
  const fast = FAST_WILAYAS.has(wilaya);
  const free = subtotal >= 60;
  return {
    days: fast ? "2 working days" : "3–5 working days",
    shipping: free ? 0 : fast ? 6 : 12,
    shippingDzd: free ? 0 : fast ? 800 : 1600,
    free,
    fast,
  };
}

/**
 * Legacy function for backward compatibility
 * Use getShippingQuote from shipping.ts for new implementations
 */
import { getShippingQuote } from "@/lib/shipping";

export function quoteDeliveryWithProvider(
  wilaya: string,
  subtotalUsd: number,
  subtotalDzd: number,
  providerId?: string,
  deliveryMethod?: "home" | "stop_desk"
) {
  return getShippingQuote(wilaya, subtotalUsd, subtotalDzd, deliveryMethod);
}

export function upsertItem(items: CartItem[], next: CartItem): CartItem[] {
  const existing = items.find((item) => item.slug === next.slug);
  if (!existing) return [...items, next];
  return items.map((item) => item.slug === next.slug ? { ...item, quantity: item.quantity + next.quantity, price: next.price, priceDzd: next.priceDzd, image: next.image ?? item.image } : item);
}

export function setQuantity(items: CartItem[], slug: string, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((item) => item.slug !== slug);
  return items.map((item) => item.slug === slug ? { ...item, quantity } : item);
}

export function smartSuggestions(items: CartItem[], catalog: Product[] = products): SmartSuggestion[] {
  const slugs = new Set(items.map((item) => item.slug));
  const categories = new Set(items.map((item) => item.category));
  const hasKind = (kind: Product["kind"]) => items.some((item) => item.kind === kind);
  const hasCategory = (category: string) => items.some((item) => item.category === category);
  const bySlug = new Map(catalog.map((product) => [product.slug, product]));
  const suggestions: SmartSuggestion[] = [];

  function offer(slug: string, reason: string) {
    const product = bySlug.get(slug);
    if (!product || slugs.has(slug) || suggestions.some((item) => item.product.slug === slug)) return;
    suggestions.push({ product, reason });
  }

  for (const companion of COMPANIONS) {
    if (companion.categories.some((category) => categories.has(category))) {
      offer(companion.slug, companion.reason);
    }
  }

  if (hasKind("plant") && !hasCategory("soil-compost")) {
    offer("organic-potting-mix", "Every plant in the cart still needs soil.");
  }
  if (hasKind("plant") && !hasCategory("pots-planters") && items.some((item) => item.category === "indoor-plants" || item.category === "succulents")) {
    offer("terracotta-planter-set", "Indoor plants arrive happier in breathable pots.");
  }
  if (hasKind("plant") && items.length >= 2 && !hasCategory("tools")) {
    offer("pruning-shears", "A sharp pair of shears for a mixed plant order.");
  }

  return suggestions.slice(0, 4);
}

export function smartTips(items: CartItem[], wilaya: string): SmartTip[] {
  const tips: SmartTip[] = [];
  const plants = items.filter((item) => item.kind === "plant");
  const equipment = items.filter((item) => item.kind === "equipment");
  const subtotal = cartSubtotal(items);
  const quote = quoteDelivery(wilaya, subtotal);

  if (!items.length) {
    return [{ id: "empty", title: "Start a growing kit", text: "Add a plant and the cart will suggest soil, pots and irrigation that match it.", href: "/shop?kind=plant" }];
  }
  if (plants.length && !equipment.length) {
    tips.push({ id: "kit", title: "Complete the kit", text: "Your plants will travel better with soil, a pot and feed. We grouped the missing pieces on the right." });
  }
  if (plants.some((item) => item.category === "outdoor-plants" || item.category === "trees" || item.category === "fruit-trees") && !items.some((item) => item.category === "irrigation")) {
    tips.push({ id: "water", title: "Dry-climate watering", text: `Outdoor plants heading to ${wilaya} last longer with drip irrigation in summer.` });
  }
  if (plants.some((item) => item.category === "indoor-plants") && !items.some((item) => item.category === "lighting")) {
    tips.push({ id: "light", title: "Indoor light", text: "A grow panel helps indoor plants through short winter days." });
  }
  if (!quote.free && subtotal > 0) {
    tips.push({ id: "ship", title: `Add $${(60 - subtotal).toFixed(0)} for free delivery`, text: `Delivery to ${wilaya} is ${quote.days}. Free across Algeria from $60.` });
  } else if (quote.free) {
    tips.push({ id: "free", title: "Free Algeria delivery", text: `This order ships to ${wilaya} in ${quote.days}, grouped in one delivery.` });
  }
  if (plants.some((item) => item.category === "trees" || item.category === "fruit-trees")) {
    tips.push({ id: "expert", title: "Ask an expert", text: "Trees and fruit trees settle faster with a local specialist who covers your wilaya.", href: "/experts" });
  }
  return tips.slice(0, 3);
}

export function addAll(items: CartItem[], extras: Product[]): CartItem[] {
  return extras.reduce((current, product) => upsertItem(current, itemFromProduct(product, 1)), items);
}

export function loadOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) as SavedOrder[] : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: SavedOrder) {
  const all = [order, ...loadOrders()].slice(0, 20);
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(all));
}

/**
 * Calculate shipping cost using the new shipping system
 * This function is kept for compatibility but should use the shipping module directly
 */
export function calculateShippingWithProvider(
  wilaya: string,
  subtotalUsd: number,
  subtotalDzd: number,
  providerId?: string,
  deliveryMethod?: "home" | "stop_desk"
) {
  // Import dynamically to avoid circular dependency
  // This function is mainly for backward compatibility
  // New code should import directly from @/lib/shipping
  try {
    // For now, use the legacy calculation to avoid circular dependency
    // The shipping calculation is handled in cart-provider.tsx
    const quote = quoteDelivery(wilaya, subtotalUsd);
    return {
      priceUsd: quote.shipping,
      priceDzd: quote.shippingDzd,
      isFree: quote.free,
      estimatedDays: quote.days,
    };
  } catch (error) {
    console.error("Error calculating shipping with provider:", error);
    const quote = quoteDelivery(wilaya, subtotalUsd);
    return {
      priceUsd: quote.shipping,
      priceDzd: quote.shippingDzd,
      isFree: quote.free,
      estimatedDays: quote.days,
    };
  }
}

export function getOrder(id: string) {
  return loadOrders().find((order) => order.id === id);
}

export function updateOrderStatus(id: string, status: OrderDeliveryStatus) {
  const all = loadOrders().map((order) => (order.id === id ? { ...order, status } : order));
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(all));
  return all.find((order) => order.id === id);
}
