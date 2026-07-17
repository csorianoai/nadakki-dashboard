/** Local facet counts from seed inventory (fallback when backend unavailable). */

import { filterVehicles } from "@/lib/search-filters";
import type { FilterState } from "@/lib/search-types";
import { VEHICLES_SEED } from "@/lib/vehicles";

const INVENTORY_SCALE = 1247 / VEHICLES_SEED.length;

export type FacetCounts = Record<string, Record<string, number>>;

function scaleCount(n: number): number {
  if (n === 0) return 0;
  return Math.max(n, Math.round(n * INVENTORY_SCALE));
}

export function countResults(state: FilterState): number {
  return scaleCount(filterVehicles(VEHICLES_SEED, state).length);
}

function countWhere(
  base: FilterState,
  predicate: (partial: Partial<FilterState>) => FilterState,
): number {
  return scaleCount(filterVehicles(VEHICLES_SEED, predicate(base)).length);
}

/** Marketing counts used when seed cannot discriminate (display fallback). */
export const MARKETING_FACET_COUNTS: FacetCounts = {
  condition: { Nuevo: 25, Usado: 7845, Certificado: 1204, "Con daños reportados": 12 },
  seller: { Todos: 1247, "Dealer verificado": 6532, "Nadakki Particular Verificado": 487 },
  bodyType: {
    "Yipeta / SUV": 342,
    Sedán: 128,
    "Camioneta / Pickup": 96,
    "Guagua / Minivan": 54,
    Deportivo: 23,
    Compacto: 87,
    Convertible: 12,
    Lujo: 41,
  },
  fuel: { Gasolina: 920, Diésel: 180, Híbrido: 95, Eléctrico: 42, GLP: 10 },
  trans: { Automática: 1050, Manual: 197, CVT: 88 },
  drivetrain: { "4x2 (delantera)": 620, "4x2 (trasera)": 180, "4x4": 340, AWD: 107 },
};

export function getFacetCount(
  facets: FacetCounts | null,
  group: string,
  value: string,
  state: FilterState,
): number | null {
  const fromApi = facets?.[group]?.[value];
  if (fromApi != null) return fromApi;
  const marketing = MARKETING_FACET_COUNTS[group]?.[value];
  if (marketing != null) return marketing;
  return null;
}

export function computeLocalFacets(state: FilterState): FacetCounts {
  const brands: Record<string, number> = {};
  for (const v of VEHICLES_SEED) {
    brands[v.make] = (brands[v.make] ?? 0) + 1;
  }
  Object.keys(brands).forEach((k) => {
    brands[k] = scaleCount(brands[k]!);
  });
  return { ...MARKETING_FACET_COUNTS, brands };
}
