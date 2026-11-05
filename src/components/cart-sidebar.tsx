"use client";

import { useState, useEffect } from "react";
import { useCart } from "./cart-provider";
import { ProductVisual } from "./product-card";
import { Button, Price, Badge } from "./ui";
import { CloseIcon, BagIcon, TruckIcon } from "./icons";
import { Link } from "./locale-link";
import { products } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { cn } from "./ui";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const cart = useCart();
  const { t } = useI18n();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    // Navigate to checkout page
    window.location.href = "/cart";
  };

  const catalogMatch = (slug: string) => {
    return products.find((item) => item.slug === slug);
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 bg-[#f4f7f2]">
            <div className="flex items-center gap-3">
              <BagIcon className="h-6 w-6 text-[#40533d]" />
              <div>
                <h2 className="text-lg font-semibold text-[#18231b]">Your Cart</h2>
                <p className="text-sm text-[#607060]">{cart.count} item{cart.count !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
              aria-label={t("cart.close")}
            >
              <CloseIcon className="h-5 w-5 text-[#607060]" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BagIcon className="h-16 w-16 text-[#e4ebe3] mb-4" />
                <p className="font-semibold text-[#18231b]">Your cart is empty</p>
                <p className="mt-2 text-sm text-[#607060]">
                  Add plants and equipment to get started
                </p>
                <Button href="/shop" variant="outline" shape="rect" className="mt-4" onClick={onClose}>
                  Browse Shop
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const product = catalogMatch(item.slug);
                  return (
                    <div
                      key={item.slug}
                      className="flex gap-3 rounded-xl border border-[#e4ebe3] p-3 bg-white"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#eef3ed]">
                        {product ? (
                          <ProductVisual
                            product={{ ...product, image: item.image ?? product.image }}
                            className="h-full"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Badge
                              tone={item.kind === "plant" ? "green" : "neutral"}
                              className="text-xs mb-1"
                            >
                              {item.kind}
                            </Badge>
                            <Link
                              href={`/shop/${item.slug}`}
                              className="block font-semibold text-sm text-[#18231b] hover:text-accent-strong truncate"
                              onClick={onClose}
                            >
                              {item.name}
                            </Link>
                            <p className="text-xs text-[#789078] mt-0.5">
                              {item.category.replaceAll("-", " ")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => cart.remove(item.slug)}
                            className="text-red-600 hover:text-red-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-[#dce5dc] bg-white">
                            <button
                              type="button"
                              onClick={() => cart.updateQuantity(item.slug, item.quantity - 1)}
                              className="grid h-7 w-7 place-items-center text-sm hover:bg-neutral-50"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => cart.updateQuantity(item.slug, item.quantity + 1)}
                              className="grid h-7 w-7 place-items-center text-sm hover:bg-neutral-50"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <Price value={item.price} dzd={item.priceDzd} className="text-sm font-semibold" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Smart Suggestions */}
            {cart.suggestions.length > 0 && cart.items.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Recommended for you</h3>
                <div className="space-y-2">
                  {cart.suggestions.slice(0, 2).map((suggestion) => (
                    <div
                      key={suggestion.product.slug}
                      className="flex gap-3 rounded-xl border border-[#e4ebe3] p-3 bg-[#f4f7f2]"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eef3ed]">
                        <ProductVisual product={suggestion.product} className="h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#18231b] truncate">
                          {suggestion.product.name}
                        </p>
                        <p className="text-xs text-[#607060] mt-1 line-clamp-2">
                          {suggestion.reason}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <Price value={suggestion.product.price} dzd={suggestion.product.priceDzd} className="text-xs" />
                          <button
                            type="button"
                            onClick={() => cart.addProduct(suggestion.product)}
                            className="text-xs font-bold text-[#40533d] hover:underline"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with shipping and checkout */}
          {cart.items.length > 0 && (
            <div className="border-t border-neutral-200 bg-[#f4f7f2] p-4 space-y-4">
              {/* Compact Shipping Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Delivery</h3>
                  <span className="text-xs text-[#607060]">
                    {cart.days} • {cart.free ? "Free" : `${cart.shippingDzd} DA`}
                  </span>
                </div>
                
                {/* Quick delivery method selector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => cart.setDeliveryMethod("home")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
                      cart.deliveryMethod === "home"
                        ? "border-[#40533d] bg-[#40533d] text-white"
                        : "border-[#e4ebe3] bg-white hover:border-[#40533d]"
                    )}
                  >
                    <TruckIcon className="h-4 w-4" />
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => cart.setDeliveryMethod("stop_desk")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
                      cart.deliveryMethod === "stop_desk"
                        ? "border-[#40533d] bg-[#40533d] text-white"
                        : "border-[#e4ebe3] bg-white hover:border-[#40533d]"
                    )}
                  >
                    <BagIcon className="h-4 w-4" />
                    Pickup
                  </button>
                </div>

                {/* Payment method quick select */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => cart.setPaymentMethod("cod")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
                      cart.paymentMethod === "cod"
                        ? "border-[#40533d] bg-[#40533d] text-white"
                        : "border-[#e4ebe3] bg-white hover:border-[#40533d]"
                    )}
                  >
                    COD
                  </button>
                  <button
                    type="button"
                    onClick={() => cart.setPaymentMethod("card")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
                      cart.paymentMethod === "card"
                        ? "border-[#40533d] bg-[#40533d] text-white"
                        : "border-[#e4ebe3] bg-white hover:border-[#40533d]"
                    )}
                  >
                    Card
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-[#e4ebe3] pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#607060]">Subtotal</span>
                  <span className="font-medium">
                    <Price value={cart.subtotal} dzd={cart.subtotalDzd} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#607060]">Delivery</span>
                  <span className="font-medium">
                    {cart.shipping === 0 ? "Free" : <Price value={cart.shipping} dzd={cart.shippingDzd} />}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>
                    <Price value={cart.total} dzd={cart.subtotalDzd + cart.shippingDzd} />
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-[#40533d] text-white hover:bg-[#506648]"
                shape="rect"
              >
                Proceed to Checkout
              </Button>

              {/* Smart Tips */}
              {cart.tips.length > 0 && (
                <div className="space-y-2">
                  {cart.tips.slice(0, 1).map((tip) => (
                    <div
                      key={tip.id}
                      className="rounded-lg bg-[#e8f0e8] p-3 text-xs"
                    >
                      <p className="font-semibold text-[#40533d]">{tip.title}</p>
                      <p className="text-[#607060] mt-1">{tip.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}