/** Autos Portal admin API — canonical `/api/v1/autos/admin/*` (OpenAPI). */

import { apiFetch } from "@/lib/api/fetch-client";
import { normalizeFlags } from "./admin-api-normalize";
import type {
  AdminDealerRow,
  AdminVehicleRow,
  AutosFeatureFlagKey,
  AutosFeatureFlags,
  DealerVerifyRequest,
  VehicleModerateRequest,
} from "./admin-types";

const BASE = "/api/v1/autos/admin";

export class AutosAdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AutosAdminApiError";
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new AutosAdminApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function moderateVehicleListing(
  tenantId: string,
  vehicleId: string,
  body: VehicleModerateRequest,
): Promise<void> {
  await adminFetch(
    `${BASE}/tenants/${encodeURIComponent(tenantId)}/vehicles/${encodeURIComponent(vehicleId)}/moderation`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function updateDealerVerification(
  tenantId: string,
  dealerId: string,
  body: DealerVerifyRequest,
): Promise<void> {
  await adminFetch(
    `${BASE}/tenants/${encodeURIComponent(tenantId)}/dealers/${encodeURIComponent(dealerId)}/verification`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function fetchFeatureFlags(tenantId: string): Promise<AutosFeatureFlags> {
  const raw = await adminFetch<unknown>(
    `${BASE}/tenants/${encodeURIComponent(tenantId)}/flags`,
  );
  return normalizeFlags(raw);
}

export async function setFeatureFlag(
  tenantId: string,
  flagKey: AutosFeatureFlagKey,
  enabled: boolean,
  twofaConfirmed = false,
): Promise<void> {
  await adminFetch(
    `${BASE}/tenants/${encodeURIComponent(tenantId)}/flags/${encodeURIComponent(flagKey)}`,
    {
      method: "PUT",
      body: JSON.stringify({ enabled, twofa_confirmed: twofaConfirmed }),
    },
  );
}

/** Optional list endpoints — 404 → caller uses demo seed. */
export async function fetchPendingVehicles(tenantId: string): Promise<AdminVehicleRow[] | null> {
  try {
    return await adminFetch<AdminVehicleRow[]>(
      `${BASE}/tenants/${encodeURIComponent(tenantId)}/vehicles/pending`,
    );
  } catch (e) {
    if (e instanceof AutosAdminApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchPendingDealers(tenantId: string): Promise<AdminDealerRow[] | null> {
  try {
    return await adminFetch<AdminDealerRow[]>(
      `${BASE}/tenants/${encodeURIComponent(tenantId)}/dealers/pending`,
    );
  } catch (e) {
    if (e instanceof AutosAdminApiError && e.status === 404) return null;
    throw e;
  }
}
