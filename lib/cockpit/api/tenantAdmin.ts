import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import type { TenantBrandingPayload, TenantRecord, PlanRecord, CoreRegistryItem } from "../types-platform";

export async function fetchTenants(): Promise<{ tenants: TenantRecord[]; isDemo: boolean }> {
  try {
    const res = await platformFetch<{ tenants: TenantRecord[]; data_source?: string }>("/api/v1/cockpit/tenants");
    return { tenants: res.tenants ?? [], isDemo: res.data_source === "none" };
  } catch (e) {
    if (e instanceof PlatformApiError && (e.status === 404 || e.status === 501)) {
      return { tenants: [], isDemo: true };
    }
    throw e;
  }
}

export async function fetchPlans(): Promise<PlanRecord[]> {
  try {
    const res = await platformFetch<{ plans: PlanRecord[] }>("/api/v1/cockpit/plans");
    return res.plans ?? [];
  } catch {
    return [];
  }
}

export async function fetchCoreRegistry(): Promise<CoreRegistryItem[]> {
  try {
    const res = await platformFetch<{ cores: CoreRegistryItem[] }>("/api/v1/cockpit/network/cores");
    return res.cores ?? [];
  } catch {
    return [];
  }
}

export interface CreateTenantBody {
  name: string;
  slug: string;
  locale: string;
  currency: string;
  branding: TenantBrandingPayload;
  plan_id: string;
  core_codes: string[];
}

export async function createTenant(body: CreateTenantBody): Promise<TenantRecord> {
  return platformFetch<TenantRecord>("/api/v1/cockpit/tenants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTenant(id: string, body: Partial<CreateTenantBody> & { status?: string }): Promise<TenantRecord> {
  return platformFetch<TenantRecord>(`/api/v1/cockpit/tenants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function toggleTenantStatus(id: string, status: "active" | "suspended"): Promise<void> {
  await platformFetch(`/api/v1/cockpit/tenants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchUsage(): Promise<{ rows: Array<{ tenant_id: string; metric: string; used: number; limit: number; data_source?: string }>; isDemo: boolean }> {
  try {
    const res = await platformFetch<{ rows: Array<{ tenant_id: string; metric: string; used: number; limit: number; data_source?: string }>; data_source?: string }>(
      "/api/v1/cockpit/network/stats",
    );
    return { rows: res.rows ?? [], isDemo: res.data_source === "none" };
  } catch (e) {
    if (e instanceof PlatformApiError && (e.status === 404 || e.status === 501)) {
      return { rows: [], isDemo: true };
    }
    throw e;
  }
}
