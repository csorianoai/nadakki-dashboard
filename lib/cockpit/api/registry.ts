import { PlatformApiError, platformFetch, type PlatformFetchInit } from "@/lib/platformApi";
import {
  normalizeRegistryEntityTypes,
  normalizeRegistryProfessions,
} from "@/lib/cockpit/finance-v3/normalize/registry";
import type {
  RegistryEntityTypesEnvelope,
  RegistryProfessionsEnvelope,
} from "@/lib/cockpit/finance-v3/contracts/registry";
import { emitRegistryMutated } from "@/lib/cockpit/finance-v3/registry-events";

export type RegistryFetchResult<T> =
  | { status: "ok"; envelope: T }
  | { status: "error"; error: string; statusCode?: number };

async function registryFetch<T>(
  path: string,
  normalize: (raw: unknown) => T,
  init?: PlatformFetchInit,
): Promise<RegistryFetchResult<T>> {
  try {
    const raw = await platformFetch<unknown>(path, init);
    return { status: "ok", envelope: normalize(raw) };
  } catch (err) {
    if (err instanceof PlatformApiError) {
      return { status: "error", error: err.message, statusCode: err.status };
    }
    return { status: "error", error: err instanceof Error ? err.message : "Error de red" };
  }
}

export function fetchRegistryProfessions(coreName?: string) {
  const q = coreName ? `?core_name=${encodeURIComponent(coreName)}` : "";
  return registryFetch(`/api/v1/cockpit/registry/professions${q}`, normalizeRegistryProfessions);
}

export function fetchRegistryEntityTypes(coreName?: string) {
  const q = coreName ? `?core_name=${encodeURIComponent(coreName)}` : "";
  return registryFetch(`/api/v1/cockpit/registry/entity-types${q}`, normalizeRegistryEntityTypes);
}

export async function createRegistryProfession(body: {
  core_name: string;
  role_code: string;
  family: string;
  display_name: string;
  description?: string | null;
  sort_order: number;
}) {
  const result = await registryFetch(
    "/api/v1/cockpit/registry/professions",
    (raw) => raw,
    { method: "POST", body: JSON.stringify(body) },
  );
  if (result.status === "ok") emitRegistryMutated();
  return result;
}

export async function updateRegistryProfession(
  id: string,
  body: Partial<{
    family: string;
    display_name: string;
    description: string | null;
    sort_order: number;
    active: boolean;
  }>,
) {
  const result = await registryFetch(
    `/api/v1/cockpit/registry/professions/${encodeURIComponent(id)}`,
    (raw) => raw,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  if (result.status === "ok") emitRegistryMutated();
  return result;
}

export async function deleteRegistryProfession(id: string) {
  const result = await registryFetch(
    `/api/v1/cockpit/registry/professions/${encodeURIComponent(id)}`,
    (raw) => raw,
    { method: "DELETE" },
  );
  if (result.status === "ok") emitRegistryMutated();
  return result;
}

export async function createRegistryEntityType(body: {
  core_name: string;
  entity_code: string;
  display_name: string;
  description?: string | null;
  sort_order: number;
}) {
  const result = await registryFetch(
    "/api/v1/cockpit/registry/entity-types",
    (raw) => raw,
    { method: "POST", body: JSON.stringify(body) },
  );
  if (result.status === "ok") emitRegistryMutated();
  return result;
}

export async function updateRegistryEntityType(
  id: string,
  body: Partial<{
    display_name: string;
    description: string | null;
    sort_order: number;
    active: boolean;
  }>,
) {
  const result = await registryFetch(
    `/api/v1/cockpit/registry/entity-types/${encodeURIComponent(id)}`,
    (raw) => raw,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  if (result.status === "ok") emitRegistryMutated();
  return result;
}

export async function deleteRegistryEntityType(id: string) {
  const result = await registryFetch(
    `/api/v1/cockpit/registry/entity-types/${encodeURIComponent(id)}`,
    (raw) => raw,
    { method: "DELETE" },
  );
  if (result.status === "ok") emitRegistryMutated();
  return result;
}
