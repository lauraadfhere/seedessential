"use client";

import { useState } from "react";
import { useCart } from "./cart-provider";
import { 
  getShippingQuote, 
  getProviderById, 
  SHIPPING_PROVIDERS,
  type DeliveryMethod,
  type PaymentMethod 
} from "@/lib/shipping";
import { Badge, Button, cn } from "./ui";
import { TruckIcon, PackageIcon, CreditCardIcon, ClockIcon } from "./icons";

export function ShippingSelector() {
  const cart = useCart();
  const [expanded, setExpanded] = useState(false);
  
  const shippingQuote = getShippingQuote(
    cart.wilaya,
    cart.subtotal,
    cart.subtotalDzd,
    cart.deliveryMethod
  );
  
  const selectedProvider = cart.shippingProvider 
    ? getProviderById(cart.shippingProvider) 
    : shippingQuote.recommended.provider;
  
  const selectedMethod = cart.deliveryMethod || "home";
  
  const handleProviderSelect = (providerId: string) => {
    cart.setShippingProvider(providerId);
  };
  
  const handleMethodSelect = (method: DeliveryMethod) => {
    cart.setDeliveryMethod(method);
  };
  
  const handlePaymentSelect = (method: PaymentMethod) => {
    cart.setPaymentMethod(method);
  };
  
  const selectedOption = shippingQuote.options.find(
    opt => opt.provider.id === (cart.shippingProvider || shippingQuote.recommended.provider.id) 
    && opt.method === (cart.deliveryMethod || "home")
  ) || shippingQuote.recommended;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Shipping Method</h3>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-semibold text-accent-strong hover:underline"
        >
          {expanded ? "Hide options" : "Change"}
        </button>
      </div>
      
      {/* Selected option summary */}
      <div className="rounded-xl border-2 border-[#40533d] bg-[#f4f7f2] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{selectedOption.provider.name}</span>
              <Badge tone="green" className="text-xs">
                {selectedOption.method === "home" ? "Home Delivery" : "Stop Desk"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[#607060]">{selectedOption.provider.positioning}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-[#789078]">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {selectedOption.estimatedDays}
              </span>
              {selectedOption.isFree && (
                <span className="font-semibold text-[#40533d]">Free delivery</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {selectedOption.isFree ? "Free" : `$${selectedOption.priceUsd}`}
            </p>
            {!selectedOption.isFree && (
              <p className="text-xs text-[#789078]">{selectedOption.priceDzd} DA</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded options */}
      {expanded && (
        <div className="space-y-4 rounded-2xl border border-[#e4ebe3] p-4">
          {/* Delivery method selection */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Delivery Method</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleMethodSelect("home")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  selectedMethod === "home"
                    ? "border-[#40533d] bg-[#f4f7f2]"
                    : "border-[#e4ebe3] hover:border-[#40533d]"
                )}
              >
                <TruckIcon className="h-5 w-5 text-[#40533d]" />
                <div>
                  <p className="font-semibold">Home Delivery</p>
                  <p className="text-xs text-[#607060]">Delivered to your address</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleMethodSelect("stop_desk")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  selectedMethod === "stop_desk"
                    ? "border-[#40533d] bg-[#f4f7f2]"
                    : "border-[#e4ebe3] hover:border-[#40533d]"
                )}
              >
                <PackageIcon className="h-5 w-5 text-[#40533d]" />
                <div>
                  <p className="font-semibold">Stop Desk</p>
                  <p className="text-xs text-[#607060]">Pick up at nearby point</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Provider selection */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Courier Providers</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {shippingQuote.options
                .filter(opt => opt.method === selectedMethod)
                .map((option) => (
                  <button
                    key={`${option.provider.id}-${option.method}`}
                    type="button"
                    onClick={() => handleProviderSelect(option.provider.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                      cart.shippingProvider === option.provider.id
                        ? "border-[#40533d] bg-[#f4f7f2]"
                        : "border-[#e4ebe3] hover:border-[#40533d]"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{option.provider.name}</span>
                        {option.provider.id === shippingQuote.recommended.provider.id && (
                          <Badge tone="green" className="text-xs">Recommended</Badge>
                        )}
                        {option.provider.id === shippingQuote.cheapest.provider.id && (
                          <Badge className="text-xs">Cheapest</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#607060]">{option.provider.positioning}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#789078]">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {option.estimatedDays}
                        </span>
                        {option.provider.cod && (
                          <span className="flex items-center gap-1">
                            <CreditCardIcon className="h-3 w-3" />
                            COD available
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {option.isFree ? "Free" : `$${option.priceUsd}`}
                      </p>
                      {!option.isFree && (
                        <p className="text-xs text-[#789078]">{option.priceDzd} DA</p>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
          
          {/* Payment method selection */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Payment Method</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handlePaymentSelect("cod")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 text-left transition",
                  cart.paymentMethod === "cod"
                    ? "border-[#40533d] bg-[#f4f7f2]"
                    : "border-[#e4ebe3] hover:border-[#40533d]"
                )}
              >
                <CreditCardIcon className="h-5 w-5 text-[#40533d]" />
                <div>
                  <p className="font-semibold">Cash on Delivery</p>
                  <p className="text-xs text-[#607060]">Pay when received</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handlePaymentSelect("card")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 text-left transition",
                  cart.paymentMethod === "card"
                    ? "border-[#40533d] bg-[#f4f7f2]"
                    : "border-[#e4ebe3] hover:border-[#40533d]"
                )}
              >
                <CreditCardIcon className="h-5 w-5 text-[#40533d]" />
                <div>
                  <p className="font-semibold">Card Payment</p>
                  <p className="text-xs text-[#607060]">Secure online payment</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handlePaymentSelect("transfer")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 text-left transition",
                  cart.paymentMethod === "transfer"
                    ? "border-[#40533d] bg-[#f4f7f2]"
                    : "border-[#e4ebe3] hover:border-[#40533d]"
                )}
                disabled
              >
                <CreditCardIcon className="h-5 w-5 text-[#40533d]" />
                <div>
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-xs text-[#607060]">Coming soon</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}