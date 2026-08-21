/** Financing bridge API — canonical autos endpoints (probe-first). */

import { autosFetch, AutosApiError } from "@/lib/autos-consumer-api";
import { resolveApiUrl, getAuthHeaders } from "@/lib/api/fetch-client";
import type {
  CreateFinancingApplicationRequest,
  CreateFinancingApplicationResponse,
  FinancingApplicationStatusResponse,
  FinancingOffer,
} from "./financing-types";

const BASE = "/api/v1/autos";

async function financingFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? undefined);
  headers.set("Content-Type", "application/json");
  if (init.idempotencyKey) {
    headers.set("Idempotency-Key", init.idempotencyKey);
  }
  const auth = getAuthHeaders();
  if (auth.Authorization) headers.set("Authorization", auth.Authorization);

  const tenant =
    typeof window !== "undefined" ? window.localStorage.getItem("nadakki_tenant_id") : null;
  if (tenant) headers.set("X-Tenant-ID", tenant);

  const res = await fetch(resolveApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
      else if (body.detail) detail = JSON.stringify(body.detail);
    } catch {
      /* ignore */
    }
    throw new AutosApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function createFinancingApplication(
  vehicleId: string,
  body: CreateFinancingApplicationRequest,
  idempotencyKey: string,
): Promise<CreateFinancingApplicationResponse> {
  try {
    return await financingFetch<CreateFinancingApplicationResponse>(
      `${BASE}/vehicles/${encodeURIComponent(vehicleId)}/financing-applications`,
      {
        method: "POST",
        body: JSON.stringify(body),
        idempotencyKey,
      },
    );
  } catch (e) {
    if (e instanceof AutosApiError && e.status === 404) {
      // Legacy path — may be mounted on some environments
      const legacy = await autosFetch<{ id?: string; applicationId?: string; creditHubUrl?: string }>(
        `${BASE}/finance/applications`,
        {
          method: "POST",
          body: JSON.stringify({ vehicle_id: vehicleId, ...body }),
          headers: { "Idempotency-Key": idempotencyKey },
        },
      );
      if (!legacy) throw e;
      return {
        applicationId: legacy.applicationId ?? legacy.id,
        creditHubUrl: legacy.creditHubUrl,
        status: "PENDING",
        created: true,
      };
    }
    throw e;
  }
}

export async function getFinancingApplicationStatus(
  applicationId: string,
): Promise<FinancingApplicationStatusResponse | null> {
  try {
    return await financingFetch<FinancingApplicationStatusResponse>(
      `${BASE}/financing-applications/${encodeURIComponent(applicationId)}`,
    );
  } catch (e) {
    if (e instanceof AutosApiError && e.status === 404) return null;
    throw e;
  }
}

export async function listFinancingOffers(applicationId: string): Promise<FinancingOffer[]> {
  try {
    const raw = await financingFetch<{ offers?: FinancingOffer[] }>(
      `${BASE}/financing-applications/${encodeURIComponent(applicationId)}/offers`,
    );
    return raw?.offers ?? [];
  } catch (e) {
    if (e instanceof AutosApiError && e.status === 404) return [];
    throw e;
  }
}
