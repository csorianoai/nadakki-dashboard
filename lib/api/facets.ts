/** Consumer search facets — backend with local fallback. */

import { getSearchFacets } from "@/lib/autos-portal/api";
import {
  computeLocalFacets,
  countResults,
  type FacetCounts,
} from "@/lib/search-facet-counts";
import type { FilterState } from "@/lib/search-types";

const FACET_KEY_MAP: Record<string, string> = {
  brands: "brands",
  make: "brands",
  fuel_types: "fuel",
  fuel: "fuel",
  body_types: "bodyType",
  body_type: "bodyType",
  transmission: "trans",
  trans: "trans",
  condition: "condition",
  seller: "seller",
  drivetrain: "drivetrain",
};

function mapBackendFacets(raw: Record<string, Array<{ value: string; count: number }>>): FacetCounts {
  const facets: FacetCounts = {};
  for (const [key, items] of Object.entries(raw)) {
    const target = FACET_KEY_MAP[key] ?? key;
    facets[target] = Object.fromEntries(items.map((item) => [item.value, item.count]));
  }
  return facets;
}

export async function getFacetsWithCounts(
  currentFilters: FilterState,
): Promise<{ facets: FacetCounts; total: number; fromBackend: boolean }> {
  try {
    const res = await getSearchFacets(currentFilters.query || undefined);
    const backendFacets = mapBackendFacets(res.facets ?? {});
    const total = countResults(currentFilters);
    return {
      facets: { ...computeLocalFacets(currentFilters), ...backendFacets },
      total,
      fromBackend: true,
    };
  } catch {
    return {
      facets: computeLocalFacets(currentFilters),
      total: countResults(currentFilters),
      fromBackend: false,
    };
  }
}
