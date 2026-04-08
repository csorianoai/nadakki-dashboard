/**
 * Tenant usage from GET /api/v1/tenants/{tenantId}/usage (same-origin / rewrites).
 */

export interface TenantUsagePayload {
  executions_this_month?: number;
  /** Credit / evaluations counter when backend exposes it */
  evaluations_this_month?: number;
  limit?: number;
  plan?: string;
  plan_name?: string;
  executions?: { date: string; agent: string; result: string }[];
}

function normalizeBody(raw: unknown): TenantUsagePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const usage = (d.data ?? d) as TenantUsagePayload | null;
  if (!usage || typeof usage !== "object") return null;
  return usage;
}

/**
 * Fetch usage for a tenant. Returns null on network/HTTP error or empty body.
 */
export async function getUsage(
  tenantId: string,
  init?: RequestInit
): Promise<TenantUsagePayload | null> {
  const tid = (tenantId ?? "").trim();
  if (!tid) return null;
  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(tid)}/usage`,
      {
        ...init,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tid,
          ...(init?.headers as Record<string, string> | undefined),
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return normalizeBody(json);
  } catch {
    return null;
  }
}

/** Prefer evaluations_this_month; fall back to executions_this_month. */
export function usageConsumedValue(u: TenantUsagePayload | null): number | null {
  if (!u) return null;
  if (
    u.evaluations_this_month != null &&
    Number.isFinite(Number(u.evaluations_this_month))
  ) {
    return Number(u.evaluations_this_month);
  }
  if (
    u.executions_this_month != null &&
    Number.isFinite(Number(u.executions_this_month))
  ) {
    return Number(u.executions_this_month);
  }
  return null;
}

export function usageLimitValue(u: TenantUsagePayload | null): number | null {
  if (!u || u.limit == null || !Number.isFinite(Number(u.limit))) return null;
  const n = Number(u.limit);
  return n > 0 ? n : null;
}

export function usagePercent(used: number | null, limit: number | null): number | null {
  if (used == null || limit == null || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}

/** Bar color: green &lt;70%, yellow 70–90%, red &gt;90% */
export function usageProgressToneClass(pct: number): string {
  if (pct > 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-400";
  return "bg-emerald-500";
}
