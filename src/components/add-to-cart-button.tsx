"use client";

import type { MouseEvent } from "react";
import type { Product } from "@/lib/data";
import { useCart } from "./cart-provider";

export function AddToCartButton({ product, quantity = 1, className, label }: { product: Product; quantity?: number; className?: string; label?: string }) {
  const { addProduct } = useCart();
  function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    addProduct(product, quantity);
  }
  return (
    <button type="button" onClick={onClick} disabled={!product.inStock} className={className}>
      {label ?? (product.inStock ? "Add" : "Unavailable")}
    </button>
  );
}
