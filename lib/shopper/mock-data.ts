/** Mock Personal Shopper data — Fase 8 demo fallback. */

import { cuota } from "@/lib/finance";
import { fmtRD } from "@/lib/format";
import { parseShopperQuery } from "@/lib/shopper/parse-preferences";
import type { ShopperMatch, ShopperPreferences, ShopperProfile } from "@/lib/shopper/types";
import { getShopperUserId } from "@/lib/shopper/storage";
import { VEHICLES_SEED, type Vehicle } from "@/lib/vehicles";

function scoreVehicle(vehicle: Vehicle, prefs: ShopperPreferences): { score: number; reasons: string[] } {
  let score = 70;
  const reasons: string[] = [];

  if (prefs.brands.length === 0 || prefs.brands.some((b) => vehicle.make.toLowerCase().includes(b.toLowerCase()))) {
    score += 10;
    if (prefs.brands.length) reasons.push(`✓ Marca preferida: ${vehicle.make}`);
  }

  if (prefs.types.length === 0 || prefs.types.some((t) => vehicle.type.includes(t.replace("Yipeta", "SUV")))) {
    score += 8;
    reasons.push(`✓ Tipo ${vehicle.type} coincide con tu búsqueda`);
  }

  if (prefs.maxPrice && vehicle.price <= prefs.maxPrice) {
    score += 7;
    reasons.push(`✓ Precio ${fmtRD(vehicle.price)} (bajo tu límite ${fmtRD(prefs.maxPrice)})`);
  } else if (!prefs.maxPrice) {
    reasons.push(`✓ Precio ${fmtRD(vehicle.price)} dentro del mercado`);
  }

  if (prefs.monthlyBudget) {
    const monthly = Math.round(cuota(vehicle.price, 20, 60));
    if (monthly <= prefs.monthlyBudget) {
      score += 5;
      reasons.push(`✓ Cuota ~RD$ ${monthly.toLocaleString("en-US")}/mes (bajo RD$ ${prefs.monthlyBudget.toLocaleString("en-US")})`);
    }
  }

  if (prefs.province === "Todas" || vehicle.loc.includes(prefs.province.split(" ")[0] ?? "")) {
    score += 4;
    reasons.push(`✓ En ${vehicle.loc} (tu área)`);
  }

  if (vehicle.verified) {
    score += 3;
    reasons.push("✓ Historial verificado DGII");
  }

  return { score: Math.min(99, score), reasons };
}

export function buildMockProfile(
  query: string,
  notifications: import("@/lib/shopper/types").ShopperNotificationChannel[],
  overrides?: Partial<ShopperPreferences>,
): ShopperProfile {
  const extracted = { ...parseShopperQuery(query), ...overrides };
  const now = new Date().toISOString();
  return {
    userId: getShopperUserId(),
    active: true,
    preferences: extracted,
    notifications,
    createdAt: now,
    updatedAt: now,
    vehiclesAnalyzedThisMonth: 342,
  };
}

export function buildMockMatches(prefs: ShopperPreferences): ShopperMatch[] {
  const ranked = VEHICLES_SEED.map((vehicle) => {
    const { score, reasons } = scoreVehicle(vehicle, prefs);
    return { vehicle, score, reasons };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const now = Date.now();
  return ranked.map(({ vehicle, score, reasons }, i) => ({
    id: `match-${vehicle.id}-${now}`,
    vehicle,
    score,
    reasons,
    status: i < 3 ? "new" : "viewed",
    matchedAt: new Date(now - i * 86_400_000).toISOString(),
  }));
}

export const DEFAULT_MOCK_QUERY =
  "yipeta familiar bajo 30 mil/mes, prefiero Toyota o Honda";
