import { NextResponse } from "next/server";
import { 
  SHIPPING_PROVIDERS, 
  getProvidersForWilaya, 
  getCodProviders, 
  getStopDeskProviders,
  filterProvidersByCapabilities 
} from "@/lib/shipping";

export const dynamic = "force-dynamic";

/**
 * GET /api/shipping/providers - Get available shipping providers
 * Query params: wilaya, cod, stopDesk, homeDelivery, api
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wilaya = searchParams.get("wilaya");
    const cod = searchParams.get("cod") === "true";
    const stopDesk = searchParams.get("stopDesk") === "true";
    const homeDelivery = searchParams.get("homeDelivery") === "true";
    const api = searchParams.get("api") === "true";

    let providers = SHIPPING_PROVIDERS;

    // Filter by wilaya if specified
    if (wilaya) {
      providers = getProvidersForWilaya(wilaya);
    }

    // Filter by capabilities if specified
    if (cod || stopDesk || homeDelivery || api) {
      providers = filterProvidersByCapabilities({
        cod,
        stopDesk,
        homeDelivery,
        api,
      });
    }

    return NextResponse.json({
      providers: providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        logo: provider.logo,
        capabilities: {
          homeDelivery: provider.homeDelivery,
          stopDesk: provider.stopDesk,
          cod: provider.cod,
          api: provider.api,
        },
        coverage: provider.coverage,
        positioning: provider.positioning,
        coverageWilayas: provider.coverageWilayas,
        pricing: {
          basePriceUsd: provider.basePriceUsd,
          basePriceDzd: provider.basePriceDzd,
          freeThresholdUsd: provider.freeThresholdUsd,
        },
        timing: {
          standardDays: provider.standardDays,
          expressDays: provider.expressDays,
        },
        ecosystem: provider.ecosystem,
      })),
      count: providers.length,
    });
  } catch (error) {
    console.error("Error getting shipping providers:", error);
    return NextResponse.json({ error: "Failed to get shipping providers" }, { status: 500 });
  }
}