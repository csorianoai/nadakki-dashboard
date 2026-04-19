/**
 * Tenant-scoped Google Ads readiness — same-origin `/api/v1/tenants/:id/google-ads/readiness`
 * (next.config rewrites + app/api/v1 catch-all proxy).
 */

import type { SuiteResult } from "@/lib/api/suiteOps";

const BASE = "";

export type CampaignTypeKey = "SEARCH" | "PERFORMANCE_MAX" | "DEMAND_GEN" | "SHOPPING" | "DSA";

export type CampaignTypeStatus = "allowed" | "blocked" | "not_ready" | "unknown";

export type OverallReadiness = "ready" | "partial" | "blocked" | "disconnected";

export type ComplianceAggregate = "cleared" | "partial" | "blocked" | "not_applicable";

export type GoogleAdsTenantReadinessPayload = {
  tenant_id: string;
  tenant_slug: string;
  /** Normalized vertical from profile (e.g. financial_services); may be unknown. */
  tenant_vertical?: string;
  overall_status: OverallReadiness;
  api_connected: boolean;
  customer_id_present: boolean;
  tracking_ready: boolean;
  compliance_status: ComplianceAggregate;
  campaign_types: Array<{
    campaign_type: CampaignTypeKey;
    status: CampaignTypeStatus;
    reasons: string[];
  }>;
  blocking_issues: string[];
  recommended_next_step: string;
  last_checked_at: string;
  data_sources?: string[];
};

function tenantHeaders(tenantId: string | null | undefined): Record<string, string> {
  const h: Record<string, string> = {};
  if (tenantId?.trim()) h["X-Tenant-ID"] = tenantId.trim();
  return h;
}

function unwrap(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o;
}

export async function getGoogleAdsTenantReadiness(
  tenantId: string
): Promise<SuiteResult<GoogleAdsTenantReadinessPayload>> {
  try {
    const res = await fetch(
      `${BASE}/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads/readiness`,
      { cache: "no-store", headers: { Accept: "application/json", ...tenantHeaders(tenantId) } }
    );
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const msg =
        typeof json === "object" && json && "detail" in json
          ? String((json as { detail: unknown }).detail)
          : "Request failed";
      return { ok: false as const, error: msg, status: res.status };
    }
    const data = unwrap(json) as GoogleAdsTenantReadinessPayload | null;
    if (!data || typeof data.tenant_id !== "string") {
      return { ok: false as const, error: "Invalid readiness payload", status: res.status };
    }
    return { ok: true as const, data, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export async function refreshGoogleAdsTenantReadiness(
  tenantId: string
): Promise<SuiteResult<GoogleAdsTenantReadinessPayload>> {
  try {
    const res = await fetch(
      `${BASE}/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads/readiness/refresh`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...tenantHeaders(tenantId),
        },
        body: "{}",
      }
    );
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const msg =
        typeof json === "object" && json && "detail" in json
          ? String((json as { detail: unknown }).detail)
          : "Request failed";
      return { ok: false as const, error: msg, status: res.status };
    }
    const data = unwrap(json) as GoogleAdsTenantReadinessPayload | null;
    if (!data || typeof data.tenant_id !== "string") {
      return { ok: false as const, error: "Invalid readiness payload", status: res.status };
    }
    return { ok: true as const, data, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

export function overallBadgeClass(status: OverallReadiness): string {
  switch (status) {
    case "ready":
      return "border-emerald-500/50 bg-emerald-500/15 text-emerald-200";
    case "partial":
      return "border-amber-500/50 bg-amber-500/15 text-amber-100";
    case "blocked":
      return "border-rose-500/50 bg-rose-500/15 text-rose-100";
    case "disconnected":
      return "border-slate-500/50 bg-slate-500/15 text-slate-300";
    default:
      return "border-white/15 bg-white/5 text-slate-300";
  }
}

export function campaignStatusClass(status: CampaignTypeStatus): string {
  switch (status) {
    case "allowed":
      return "text-emerald-300";
    case "blocked":
      return "text-rose-300";
    case "not_ready":
      return "text-amber-200";
    default:
      return "text-slate-400";
  }
}
