/** Consumer vehicles API with seed fallback. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { backendVehicleToConsumer, mapBackendVehicle } from "@/lib/api/vehicle-mapper";
import type { FilterState } from "@/lib/search-types";
import { filterVehicles, sortVehicles } from "@/lib/search-filters";
import { VEHICLES_SEED, getVehicleById, type Vehicle } from "@/lib/vehicles";
import type { VehicleSearchResult } from "@/types/autos";

function filtersToPayload(state: FilterState) {
  return {
    query: state.query || undefined,
    make: state.brands[0] || undefined,
    model: state.model || undefined,
    year_min: state.yearMin ?? undefined,
    year_max: state.yearMax ?? undefined,
    price_min: state.minPrice ?? undefined,
    price_max: state.maxPrice ?? undefined,
    body_type: state.types[0] || undefined,
    fuel_type: state.fuels[0] || undefined,
    transmission: state.trans[0] || undefined,
    province: state.provinces[0] || undefined,
    page: 1,
    page_size: state.pageSize,
  };
}

export type VehicleSearchResponse = {
  vehicles: Vehicle[];
  total: number;
  fromBackend: boolean;
};

export async function searchVehiclesConsumer(
  state: FilterState,
): Promise<VehicleSearchResponse> {
  try {
    const res = await autosFetch<VehicleSearchResult>("/api/v1/autos/vehicles/search", {
      method: "POST",
      body: JSON.stringify(filtersToPayload(state)),
    });
    if (!res?.vehicles?.length) {
      const local = sortVehicles(filterVehicles(VEHICLES_SEED, state), state.sort);
      return { vehicles: local, total: local.length, fromBackend: false };
    }
    const vehicles = res.vehicles.map((v, i) =>
      mapBackendVehicle(v, VEHICLES_SEED[i % VEHICLES_SEED.length]?.id ?? i + 1),
    );
    return { vehicles, total: res.total ?? vehicles.length, fromBackend: true };
  } catch (error) {
    console.warn("Backend down, using mock", error);
    const local = sortVehicles(filterVehicles(VEHICLES_SEED, state), state.sort);
    return { vehicles: local, total: local.length, fromBackend: false };
  }
}

export async function getVehicleConsumer(
  id: string | number,
): Promise<{ vehicle: Vehicle | undefined; fromBackend: boolean }> {
  try {
    const res = await autosFetch<import("@/types/autos").Vehicle>(
      `/api/v1/autos/vehicles/${id}`,
    );
    const vehicle = backendVehicleToConsumer(res, id);
    return { vehicle, fromBackend: !!res };
  } catch (error) {
    console.warn("Backend down, using mock", error);
    return { vehicle: getVehicleById(id), fromBackend: false };
  }
}

export async function getFacetsConsumer(
  state: FilterState,
): Promise<{ facets: Record<string, Record<string, number>>; fromBackend: boolean }> {
  try {
    const qs = state.query ? `?q=${encodeURIComponent(state.query)}` : "";
    const res = await autosFetch<{ facets: Record<string, Array<{ value: string; count: number }>> }>(
      `/api/v1/autos/vehicles/search/facets${qs}`,
    );
    if (!res?.facets) throw new Error("no facets");
    const facets: Record<string, Record<string, number>> = {};
    for (const [key, items] of Object.entries(res.facets)) {
      facets[key] = Object.fromEntries(items.map((i) => [i.value, i.count]));
    }
    return { facets, fromBackend: true };
  } catch {
    return { facets: {}, fromBackend: false };
  }
}

// Re-export for named imports matching spec
export { searchVehiclesConsumer as searchVehicles };
export { getVehicleConsumer as getVehicle };
export { getFacetsConsumer as getFacets };
