"use client";

import { Badge } from "./ui";
import { TruckIcon, PackageIcon, CreditCardIcon, ClockIcon } from "./icons";
import { getProviderById } from "@/lib/shipping";

interface OrderSummaryProps {
  shippingProvider?: string;
  deliveryMethod?: "home" | "stop_desk";
  paymentMethod?: "cod" | "card" | "transfer";
  estimatedDays?: string;
  shippingCost?: number;
  shippingCostDzd?: number;
}

export function OrderSummary({
  shippingProvider,
  deliveryMethod,
  paymentMethod,
  estimatedDays,
  shippingCost,
  shippingCostDzd,
}: OrderSummaryProps) {
  const provider = shippingProvider ? getProviderById(shippingProvider) : null;

  if (!provider) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#e4ebe3] bg-[#f4f7f2] p-4">
      <h4 className="font-semibold mb-3">Shipping Details</h4>
      
      <div className="space-y-3">
        {/* Provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-[#40533d]" />
            <span className="text-sm font-medium">{provider.name}</span>
          </div>
          <Badge tone="green" className="text-xs">
            {provider.ecosystem === "ecommerce" ? "E-commerce" : "Standard"}
          </Badge>
        </div>

        {/* Delivery Method */}
        <div className="flex items-center gap-2">
          {deliveryMethod === "home" ? (
            <TruckIcon className="h-4 w-4 text-[#40533d]" />
          ) : (
            <PackageIcon className="h-4 w-4 text-[#40533d]" />
          )}
          <span className="text-sm">
            {deliveryMethod === "home" ? "Home Delivery" : "Stop Desk Pickup"}
          </span>
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4 text-[#40533d]" />
            <span className="text-sm">
              {paymentMethod === "cod" ? "Cash on Delivery" : 
               paymentMethod === "card" ? "Card Payment" : "Bank Transfer"}
            </span>
          </div>
        )}

        {/* Timing */}
        {estimatedDays && (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-[#40533d]" />
            <span className="text-sm text-[#607060]">{estimatedDays}</span>
          </div>
        )}

        {/* Cost */}
        {shippingCost !== undefined && (
          <div className="flex items-center justify-between pt-2 border-t border-[#e4ebe3]">
            <span className="text-sm font-medium">Shipping Cost</span>
            <span className="text-sm font-semibold">
              {shippingCost === 0 ? "Free" : `$${shippingCost}`}
              {shippingCostDzd && shippingCost > 0 && (
                <span className="text-xs text-[#789078] ml-1">({shippingCostDzd} DA)</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}