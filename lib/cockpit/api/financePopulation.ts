import { fetchOrDemo } from "./fetchOrDemo";
import {
  demoAllPopulationByCore,
  demoPopulationActivity,
  demoPopulationByCore,
  demoPopulationByCountry,
  demoPopulationByEntityType,
  demoPopulationByFamily,
  demoPopulationDigitalAgents,
  demoPopulationSummary,
  demoTopTenants,
  demoTopUsers,
} from "../demo-population";
import type {
  PopulationActivityResponse,
  PopulationByCoreResponse,
  PopulationByCountryResponse,
  PopulationByEntityTypeResponse,
  PopulationByFamilyResponse,
  PopulationDigitalAgentsResponse,
  PopulationSummaryResponse,
  PopulationTopTenantsResponse,
  PopulationTopUsersResponse,
} from "../types-finance";

export function fetchPopulationSummary() {
  return fetchOrDemo<PopulationSummaryResponse>(
    "/api/v1/cockpit/population/summary",
    demoPopulationSummary,
  );
}

export function fetchPopulationByCore(coreCode: string) {
  return fetchOrDemo<PopulationByCoreResponse>(
    `/api/v1/cockpit/population/by-core/${encodeURIComponent(coreCode)}`,
    () => demoPopulationByCore(coreCode),
  );
}

export async function fetchAllPopulationByCore(codes: string[]) {
  const results = await Promise.all(codes.map((c) => fetchPopulationByCore(c)));
  const isDemo = results.some((r) => r.isDemo);
  return { cores: results.map((r) => r.data), isDemo };
}

export function fetchTopTenants(limit = 10) {
  return fetchOrDemo<PopulationTopTenantsResponse>(
    `/api/v1/cockpit/population/top-tenants?limit=${limit}`,
    demoTopTenants,
  );
}

export function fetchTopUsers(limit = 10) {
  return fetchOrDemo<PopulationTopUsersResponse>(
    `/api/v1/cockpit/population/top-users?limit=${limit}`,
    demoTopUsers,
  );
}

export function fetchPopulationByFamily(family: string) {
  return fetchOrDemo<PopulationByFamilyResponse>(
    `/api/v1/cockpit/population/by-family?family=${encodeURIComponent(family)}`,
    () => demoPopulationByFamily(family),
  );
}

export function fetchPopulationByEntityType() {
  return fetchOrDemo<PopulationByEntityTypeResponse>(
    "/api/v1/cockpit/population/by-entity-type",
    demoPopulationByEntityType,
  );
}

export function fetchPopulationByCountry() {
  return fetchOrDemo<PopulationByCountryResponse>(
    "/api/v1/cockpit/population/by-country",
    demoPopulationByCountry,
  );
}

export function fetchPopulationDigitalAgents() {
  return fetchOrDemo<PopulationDigitalAgentsResponse>(
    "/api/v1/cockpit/population/digital-agents",
    demoPopulationDigitalAgents,
  );
}

export function fetchPopulationActivity(period: string) {
  return fetchOrDemo<PopulationActivityResponse>(
    `/api/v1/cockpit/population/activity?period=${encodeURIComponent(period)}`,
    () => demoPopulationActivity(period),
  );
}

/** Batch helper when by-core list endpoint missing */
export function fetchPopulationByCoreBatchFallback() {
  return {
    data: demoAllPopulationByCore(),
    isDemo: true,
    error: null,
  };
}
