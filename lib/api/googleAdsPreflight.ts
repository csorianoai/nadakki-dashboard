/**
 * Google Ads action pre-flight — POST /api/v1/tenants/:id/google-ads/preflight
 * (same-origin; next.config rewrites + app/api/v1 proxy).
 */

import type { SuiteResult } from "@/lib/api/suiteOps";

const BASE = "";

export type GoogleAdsPreflightStatus = "allowed" | "proposal_only" | "blocked" | "not_ready";

export type GoogleAdsPreflightResult = {
  action_key: string;
  tenant_id: string;
  status: GoogleAdsPreflightStatus;
  reasons: string[];
  required_fixes: string[];
  approval_required: boolean;
  next_step: string;
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

export async function postGoogleAdsPreflight(
  tenantId: string,
  actionKey: string,
  payload: Record<string, unknown> = {}
): Promise<SuiteResult<GoogleAdsPreflightResult>> {
  try {
    const res = await fetch(
      `${BASE}/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads/preflight`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...tenantHeaders(tenantId),
        },
        body: JSON.stringify({ action_key: actionKey, payload }),
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
    const raw = unwrap(json) as GoogleAdsPreflightResult | null;
    if (!raw || typeof raw.action_key !== "string" || typeof raw.status !== "string") {
      return { ok: false as const, error: "Invalid preflight payload", status: res.status };
    }
    return { ok: true as const, data: raw, status: res.status };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message, status: 0 };
  }
}

/** Extract structured preflight from FastAPI HTTP error body when execute is blocked server-side. */
export function preflightFromExecuteErrorBody(body: unknown): GoogleAdsPreflightResult | null {
  if (!body || typeof body !== "object") return null;
  const d = (body as { detail?: unknown }).detail;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  const pf = (d as { preflight?: unknown }).preflight;
  if (!pf || typeof pf !== "object") return null;
  const o = pf as Record<string, unknown>;
  if (typeof o.action_key !== "string" || typeof o.status !== "string") return null;
  return {
    action_key: o.action_key,
    tenant_id: String(o.tenant_id ?? ""),
    status: o.status as GoogleAdsPreflightStatus,
    reasons: Array.isArray(o.reasons) ? o.reasons.map(String) : [],
    required_fixes: Array.isArray(o.required_fixes) ? o.required_fixes.map(String) : [],
    approval_required: Boolean(o.approval_required),
    next_step: String(o.next_step ?? ""),
  };
}
