/**
 * Shipping provider system for Algerian couriers
 * Supports multiple delivery methods, COD, and coverage management
 */

export type DeliveryMethod = "home" | "stop_desk";
export type PaymentMethod = "cod" | "card" | "transfer";

export interface ShippingProvider {
  id: string;
  name: string;
  logo?: string;
  // Delivery capabilities
  homeDelivery: boolean;
  stopDesk: boolean;
  cod: boolean;
  api: boolean;
  // Coverage and positioning
  coverage: "national" | "regional" | "ecotrack";
  positioning: string;
  coverageWilayas?: string[];
  // Pricing
  basePriceUsd: number;
  basePriceDzd: number;
  pricePerKmUsd?: number;
  freeThresholdUsd: number;
  // Delivery timing
  standardDays: string;
  expressDays?: string;
  // Provider ecosystem
  ecosystem?: "ecotrack" | "independent" | "ecommerce";
}

export const SHIPPING_PROVIDERS: ShippingProvider[] = [
  {
    id: "yalidine",
    name: "Yalidine",
    homeDelivery: true,
    stopDesk: true,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Very broad coverage, reliable COD",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "2-3 working days",
    ecosystem: "independent",
  },
  {
    id: "zr_express",
    name: "ZR Express / Procolis",
    logo: "tannelli/shipping/zr-express",
    homeDelivery: true,
    stopDesk: true,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Strong national network",
    basePriceUsd: 7,
    basePriceDzd: 950,
    freeThresholdUsd: 60,
    standardDays: "2-3 working days",
    expressDays: "1-2 working days",
    ecosystem: "independent",
  },
  {
    id: "maystro",
    name: "Maystro Delivery",
    homeDelivery: true,
    stopDesk: true,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "E-commerce focused delivery",
    basePriceUsd: 8,
    basePriceDzd: 1100,
    freeThresholdUsd: 50,
    standardDays: "2-4 working days",
    ecosystem: "ecommerce",
  },
  {
    id: "noest",
    name: "NOEST",
    homeDelivery: true,
    stopDesk: true,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "National coverage",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-4 working days",
    ecosystem: "independent",
  },
  {
    id: "dhd",
    name: "DHD",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Ecotrack ecosystem integration",
    basePriceUsd: 7,
    basePriceDzd: 950,
    freeThresholdUsd: 60,
    standardDays: "3-5 working days",
    ecosystem: "ecotrack",
  },
  {
    id: "conexlog",
    name: "Conexlog",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Ecotrack ecosystem",
    basePriceUsd: 7,
    basePriceDzd: 950,
    freeThresholdUsd: 60,
    standardDays: "3-5 working days",
    ecosystem: "ecotrack",
  },
  {
    id: "msm_go",
    name: "MSM Go",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Ecotrack ecosystem",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-5 working days",
    ecosystem: "ecotrack",
  },
  {
    id: "rocket_delivery",
    name: "Rocket Delivery",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Ecotrack ecosystem",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-5 working days",
    ecosystem: "ecotrack",
  },
  {
    id: "world_express",
    name: "World Express",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "Ecotrack ecosystem",
    basePriceUsd: 7,
    basePriceDzd: 950,
    freeThresholdUsd: 60,
    standardDays: "3-5 working days",
    ecosystem: "ecotrack",
  },
  {
    id: "zimou_express",
    name: "Zimou Express",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "National coverage",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-4 working days",
    ecosystem: "independent",
  },
  {
    id: "colivraison",
    name: "Colivraison",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "National coverage",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-4 working days",
    ecosystem: "independent",
  },
  {
    id: "ecom_delivery",
    name: "Ecom Delivery",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "E-commerce specialist",
    basePriceUsd: 7,
    basePriceDzd: 950,
    freeThresholdUsd: 50,
    standardDays: "2-4 working days",
    ecosystem: "ecommerce",
  },
  {
    id: "elogistia",
    name: "Elogistia",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "National logistics",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-4 working days",
    ecosystem: "independent",
  },
  {
    id: "near_delivery",
    name: "Near Delivery",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "National coverage",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-4 working days",
    ecosystem: "independent",
  },
  {
    id: "mdm_express",
    name: "MDM Express",
    homeDelivery: true,
    stopDesk: false,
    cod: true,
    api: true,
    coverage: "national",
    positioning: "National coverage",
    basePriceUsd: 6,
    basePriceDzd: 800,
    freeThresholdUsd: 60,
    standardDays: "3-4 working days",
    ecosystem: "independent",
  },
];

export interface ShippingOption {
  provider: ShippingProvider;
  method: DeliveryMethod;
  priceUsd: number;
  priceDzd: number;
  estimatedDays: string;
  isFree: boolean;
}

export interface ShippingQuote {
  options: ShippingOption[];
  recommended: ShippingOption;
  cheapest: ShippingOption;
  fastest: ShippingOption;
}

/**
 * Get available shipping providers for a specific wilaya
 */
export function getProvidersForWilaya(wilaya: string): ShippingProvider[] {
  // For now, all providers support national coverage
  // In production, check provider-specific coverageWilayas
  return SHIPPING_PROVIDERS.filter(provider => {
    if (provider.coverageWilayas) {
      return provider.coverageWilayas.includes(wilaya);
    }
    return provider.coverage === "national";
  });
}

/**
 * Calculate shipping cost based on provider, method, and order value
 */
export function calculateShippingCost(
  provider: ShippingProvider,
  method: DeliveryMethod,
  subtotalUsd: number,
  subtotalDzd: number
): { priceUsd: number; priceDzd: number; isFree: boolean } {
  const isFree = subtotalUsd >= provider.freeThresholdUsd;
  
  // Stop-desk is typically cheaper than home delivery
  const methodMultiplier = method === "stop_desk" ? 0.7 : 1.0;
  
  const priceUsd = isFree ? 0 : Math.round(provider.basePriceUsd * methodMultiplier);
  const priceDzd = isFree ? 0 : Math.round(provider.basePriceDzd * methodMultiplier);
  
  return { priceUsd, priceDzd, isFree };
}

/**
 * Get shipping quote for a cart with subtotal
 */
export function getShippingQuote(
  wilaya: string,
  subtotalUsd: number,
  subtotalDzd: number,
  preferredMethod?: DeliveryMethod
): ShippingQuote {
  const availableProviders = getProvidersForWilaya(wilaya);
  
  const options: ShippingOption[] = [];
  
  for (const provider of availableProviders) {
    // Check if provider supports the preferred method
    const methods: DeliveryMethod[] = [];
    if (provider.homeDelivery) methods.push("home");
    if (provider.stopDesk) methods.push("stop_desk");
    
    for (const method of methods) {
      // If preferred method is specified, only show that method
      if (preferredMethod && method !== preferredMethod) continue;
      
      const { priceUsd, priceDzd, isFree } = calculateShippingCost(
        provider,
        method,
        subtotalUsd,
        subtotalDzd
      );
      
      const estimatedDays = method === "stop_desk" 
        ? provider.standardDays 
        : (provider.expressDays || provider.standardDays);
      
      options.push({
        provider,
        method,
        priceUsd,
        priceDzd,
        estimatedDays,
        isFree,
      });
    }
  }
  
  // Sort by price (cheapest first)
  options.sort((a, b) => a.priceUsd - b.priceUsd);
  
  // Find recommended (balance of price and speed)
  const recommended = options.find(opt => 
    opt.provider.ecosystem === "ecommerce" || 
    opt.provider.id === "yalidine" ||
    opt.provider.id === "zr_express"
  ) || options[0];
  
  const cheapest = options[0];
  const fastest = options.reduce((fastest, current) => 
    parseInt(current.estimatedDays) < parseInt(fastest.estimatedDays) ? current : fastest
  );
  
  return {
    options,
    recommended,
    cheapest,
    fastest,
  };
}

/**
 * Get provider by ID
 */
export function getProviderById(id: string): ShippingProvider | undefined {
  return SHIPPING_PROVIDERS.find(p => p.id === id);
}

/**
 * Filter providers by capabilities
 */
export function filterProvidersByCapabilities(
  capabilities: {
    cod?: boolean;
    homeDelivery?: boolean;
    stopDesk?: boolean;
    api?: boolean;
  }
): ShippingProvider[] {
  return SHIPPING_PROVIDERS.filter(provider => {
    if (capabilities.cod && !provider.cod) return false;
    if (capabilities.homeDelivery && !provider.homeDelivery) return false;
    if (capabilities.stopDesk && !provider.stopDesk) return false;
    if (capabilities.api && !provider.api) return false;
    return true;
  });
}

/**
 * Get providers that support COD
 */
export function getCodProviders(): ShippingProvider[] {
  return filterProvidersByCapabilities({ cod: true });
}

/**
 * Get providers that support stop-desk delivery
 */
export function getStopDeskProviders(): ShippingProvider[] {
  return filterProvidersByCapabilities({ stopDesk: true });
}