/**
 * Tenant observability API (EP-T3-3 JSON + EP-T3-5 Prometheus /metrics).
 * Proxied same-origin via next.config → `/api/v1/tenants/:path*` and `/metrics`.
 */
import type {
  AuditTrailPayload,
  ObservabilityDashboardPayload,
  SlaMonitoringPayload,
} from "@/lib/admin/observability-types";
import { resolveObservabilityXRole } from "@/lib/admin/observability-role";

export function observabilityHeaders(tenantId: string, dashboardAuthRole?: string | null): HeadersInit {
  const id = tenantId.trim();
  const role = resolveObservabilityXRole(dashboardAuthRole);
  return {
    ...(id ? { "X-Tenant-ID": id } : {}),
    "X-Role": role,
  };
}

function jsonHeaders(tenantId: string, dashboardAuthRole?: string | null): HeadersInit {
  return {
    Accept: "application/json",
    ...observabilityHeaders(tenantId, dashboardAuthRole),
  };
}

function unwrapPayload<T>(json: unknown): T | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const inner = o.data !== undefined ? o.data : json;
  return inner as T;
}

/** Plain-text Prometheus exposition (instant scrape). */
export async function fetchPrometheusMetrics(
  tenantId: string,
  dashboardAuthRole?: string | null,
): Promise<string | null> {
  const id = tenantId.trim();
  if (!id) return null;
  try {
    const res = await fetch("/metrics", {
      headers: {
        Accept: "text/plain;version=0.0.4;q=0.3,*/*;q=0.1",
        ...observabilityHeaders(id, dashboardAuthRole),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchObservabilityDashboard(
  tenantId: string,
  dashboardAuthRole?: string | null,
): Promise<ObservabilityDashboardPayload | null> {
  const id = tenantId.trim();
  if (!id) return null;
  try {
    const res = await fetch(`/api/v1/tenants/${encodeURIComponent(id)}/observability/dashboard`, {
      headers: jsonHeaders(id, dashboardAuthRole),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    return unwrapPayload<ObservabilityDashboardPayload>(raw);
  } catch {
    return null;
  }
}

export async function fetchObservabilityAuditTrail(
  tenantId: string,
  dashboardAuthRole?: string | null,
): Promise<AuditTrailPayload | null> {
  const id = tenantId.trim();
  if (!id) return null;
  try {
    const res = await fetch(`/api/v1/tenants/${encodeURIComponent(id)}/observability/audit-trail`, {
      headers: jsonHeaders(id, dashboardAuthRole),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    return unwrapPayload<AuditTrailPayload>(raw);
  } catch {
    return null;
  }
}

export async function fetchObservabilitySla(
  tenantId: string,
  dashboardAuthRole?: string | null,
): Promise<SlaMonitoringPayload | null> {
  const id = tenantId.trim();
  if (!id) return null;
  try {
    const res = await fetch(`/api/v1/tenants/${encodeURIComponent(id)}/observability/sla`, {
      headers: jsonHeaders(id, dashboardAuthRole),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = await res.json().catch(() => null);
    return unwrapPayload<SlaMonitoringPayload>(raw);
  } catch {
    return null;
  }
}
