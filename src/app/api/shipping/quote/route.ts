import { NextResponse } from "next/server";
import { getShippingQuote } from "@/lib/shipping";

export const dynamic = "force-dynamic";

/**
 * GET /api/shipping/quote - Get shipping quote for cart
 * Query params: wilaya, subtotal, subtotalDzd, deliveryMethod
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wilaya = searchParams.get("wilaya");
    const subtotal = parseFloat(searchParams.get("subtotal") || "0");
    const subtotalDzd = parseFloat(searchParams.get("subtotalDzd") || "0");
    const deliveryMethod = searchParams.get("deliveryMethod") as "home" | "stop_desk" | null;

    if (!wilaya) {
      return NextResponse.json({ error: "Wilaya is required" }, { status: 400 });
    }

    const quote = getShippingQuote(wilaya, subtotal, subtotalDzd, deliveryMethod || undefined);

    return NextResponse.json({
      options: quote.options.map(opt => ({
        providerId: opt.provider.id,
        providerName: opt.provider.name,
        method: opt.method,
        priceUsd: opt.priceUsd,
        priceDzd: opt.priceDzd,
        estimatedDays: opt.estimatedDays,
        isFree: opt.isFree,
        positioning: opt.provider.positioning,
        capabilities: {
          cod: opt.provider.cod,
          homeDelivery: opt.provider.homeDelivery,
          stopDesk: opt.provider.stopDesk,
          api: opt.provider.api,
        },
      })),
      recommended: {
        providerId: quote.recommended.provider.id,
        providerName: quote.recommended.provider.name,
        method: quote.recommended.method,
        priceUsd: quote.recommended.priceUsd,
        priceDzd: quote.recommended.priceDzd,
        estimatedDays: quote.recommended.estimatedDays,
        isFree: quote.recommended.isFree,
      },
      cheapest: {
        providerId: quote.cheapest.provider.id,
        providerName: quote.cheapest.provider.name,
        method: quote.cheapest.method,
        priceUsd: quote.cheapest.priceUsd,
        priceDzd: quote.cheapest.priceDzd,
        estimatedDays: quote.cheapest.estimatedDays,
        isFree: quote.cheapest.isFree,
      },
      fastest: {
        providerId: quote.fastest.provider.id,
        providerName: quote.fastest.provider.name,
        method: quote.fastest.method,
        priceUsd: quote.fastest.priceUsd,
        priceDzd: quote.fastest.priceDzd,
        estimatedDays: quote.fastest.estimatedDays,
        isFree: quote.fastest.isFree,
      },
    });
  } catch (error) {
    console.error("Error getting shipping quote:", error);
    return NextResponse.json({ error: "Failed to get shipping quote" }, { status: 500 });
  }
}