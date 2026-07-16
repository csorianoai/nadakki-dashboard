/** Natural-language query parser — README §8.3 */

import type { FilterState } from "@/lib/search-types";

function parsePriceToken(raw: string): number | undefined {
  const normalized = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const mMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*m(?:illones?)?/i);
  if (mMatch) {
    const n = parseFloat(mMatch[1]!.replace(",", "."));
    return Math.round(n * 1_000_000);
  }
  const milMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/i);
  if (milMatch) {
    const n = parseFloat(milMatch[1]!.replace(",", "."));
    return Math.round(n * 1_000);
  }
  const plain = normalized.match(/\b(\d{4,})\b/);
  if (plain) return Number(plain[1]);
  return undefined;
}

export function parseNaturalQuery(query: string): Partial<FilterState> {
  const q = query.trim();
  if (!q) return { query: "" };

  const lower = q.toLowerCase();
  const partial: Partial<FilterState> = { query: q };
  const types: string[] = [];
  const brands: string[] = [];

  const priceFromText = parsePriceToken(lower);
  if (priceFromText) partial.maxPrice = priceFromText;

  if (/uber|econ|barat/.test(lower)) {
    types.push("Sedán");
    partial.maxPrice = partial.maxPrice ?? 1_200_000;
  }
  if (/yipet|jeepet|suv|playa|famil/.test(lower)) {
    types.push("SUV");
  }
  if (/premium|lujo|bmw|merc/.test(lower)) {
    types.push("Premium");
    if (/bmw/.test(lower)) brands.push("BMW");
    if (/merc/.test(lower)) brands.push("Mercedes-Benz");
  }

  if (types.length) partial.types = [...new Set(types)];
  if (brands.length) partial.brands = [...new Set(brands)];

  return partial;
}
