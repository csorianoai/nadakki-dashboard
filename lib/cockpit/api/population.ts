import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import {
  normalizeDigitalAgents,
  normalizePopulationByCore,
  normalizePopulationByCountry,
  normalizePopulationByEntity,
  normalizePopulationByFamily,
  normalizePopulationSummary,
  normalizeTopTenants,
  normalizeTopUsers,
} from "@/lib/cockpit/finance-v3/normalize/population";
import type {
  DigitalAgentsEnvelope,
  PopulationByCoreEnvelope,
  PopulationByCountryEnvelope,
  PopulationByEntityEnvelope,
  PopulationByFamilyEnvelope,
  PopulationSummaryEnvelope,
  TopTenantsEnvelope,
  TopUsersEnvelope,
} from "@/lib/cockpit/finance-v3/contracts/population";

export type PopulationFetchResult<T> =
  | { status: "ok"; envelope: T }
  | { status: "error"; error: string };

async function fetchPopulation<T>(
  path: string,
  normalize: (raw: unknown) => T,
): Promise<PopulationFetchResult<T>> {
  try {
    const raw = await platformFetch<unknown>(path);
    return { status: "ok", envelope: normalize(raw) };
  } catch (err) {
    if (err instanceof PlatformApiError) {
      if (err.status === 403) return { status: "error", error: "Acceso denegado (403)" };
      if (err.status === 404 || err.status === 501) {
        return { status: "error", error: `Endpoint no disponible (${err.status})` };
      }
    }
    return { status: "error", error: err instanceof Error ? err.message : "Error de red" };
  }
}

export function fetchPopulationSummary() {
  return fetchPopulation("/api/v1/cockpit/population/summary", normalizePopulationSummary);
}

export function fetchPopulationTopTenants(limit = 10) {
  return fetchPopulation(
    `/api/v1/cockpit/population/top-tenants?limit=${limit}`,
    normalizeTopTenants,
  );
}

export function fetchPopulationTopUsers(limit = 10) {
  return fetchPopulation(
    `/api/v1/cockpit/population/top-users?limit=${limit}`,
    normalizeTopUsers,
  );
}

export function fetchPopulationByCore(coreName: string) {
  return fetchPopulation(
    `/api/v1/cockpit/population/by-core?core_name=${encodeURIComponent(coreName)}`,
    normalizePopulationByCore,
  );
}

export function fetchPopulationByFamily(family: string) {
  return fetchPopulation(
    `/api/v1/cockpit/population/by-family?family=${encodeURIComponent(family)}`,
    normalizePopulationByFamily,
  );
}

export function fetchPopulationByEntity() {
  return fetchPopulation(
    "/api/v1/cockpit/population/by-entity-type",
    normalizePopulationByEntity,
  );
}

export function fetchPopulationByCountry() {
  return fetchPopulation(
    "/api/v1/cockpit/population/by-country",
    normalizePopulationByCountry,
  );
}

export function fetchPopulationDigitalAgents() {
  return fetchPopulation(
    "/api/v1/cockpit/population/digital-agents",
    normalizeDigitalAgents,
  );
}

export type {
  PopulationSummaryEnvelope,
  PopulationByCoreEnvelope,
  PopulationByFamilyEnvelope,
  PopulationByEntityEnvelope,
  PopulationByCountryEnvelope,
  DigitalAgentsEnvelope,
  TopTenantsEnvelope,
  TopUsersEnvelope,
};
