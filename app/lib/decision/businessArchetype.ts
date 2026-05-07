// app/lib/decision/businessArchetype.ts

export type BusinessArchetype =
  | "IT_SERVICES"
  | "MANUFACTURING"
  | "AGRO_CONSUMER"
  | "FINANCIAL"
  | "ETF"
  | "UNKNOWN";

/**
 * Canonical, deterministic classification.
 * This is NOT an assumption or opinion.
 */
export const BUSINESS_ARCHETYPE_MAP: Record<string, BusinessArchetype> = {
  INFY: "IT_SERVICES",
  TCS: "IT_SERVICES",
  WIPRO: "IT_SERVICES",

  CYIENTDLM: "MANUFACTURING",
  BEL: "MANUFACTURING",

  AWL: "AGRO_CONSUMER",

  BANKBEES: "ETF",

  DEFAULT: "UNKNOWN",
};

export function getBusinessArchetype(symbol: string): BusinessArchetype {
  return BUSINESS_ARCHETYPE_MAP[symbol] ?? BUSINESS_ARCHETYPE_MAP.DEFAULT;
}
