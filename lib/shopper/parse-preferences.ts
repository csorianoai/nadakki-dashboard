/** Extract shopper preferences from natural language query. */

import { parseNaturalQuery } from "@/lib/search-parser";
import type { ShopperPreferences } from "@/lib/shopper/types";

function parseMonthlyBudget(text: string): number | undefined {
  const lower = text.toLowerCase();
  const m = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)?\s*(?:\/|por)\s*mes/i);
  if (!m) return undefined;
  const n = parseFloat(m[1]!.replace(",", "."));
  return /mil|k/.test(m[0]) ? Math.round(n * 1_000) : Math.round(n);
}

function parseProvince(text: string): string {
  const lower = text.toLowerCase();
  if (/distrito|santo domingo|dn\b/.test(lower)) return "Distrito Nacional";
  if (/santiago/.test(lower)) return "Santiago";
  if (/la vega/.test(lower)) return "La Vega";
  if (/san crist/.test(lower)) return "San Cristóbal";
  if (/puerto plata/.test(lower)) return "Puerto Plata";
  return "Todas";
}

export function parseShopperQuery(query: string): ShopperPreferences {
  const parsed = parseNaturalQuery(query);
  const monthlyBudget = parseMonthlyBudget(query);

  return {
    query,
    types: parsed.types ?? (monthlyBudget ? ["SUV"] : []),
    brands: parsed.brands ?? [],
    maxPrice: parsed.maxPrice,
    monthlyBudget,
    province: parseProvince(query),
  };
}
