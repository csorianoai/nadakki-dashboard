/**
 * Canonical tenant-scoped access client.
 * BACKEND_SHA a38dc23d6418aec568df21d8204d883166ec5604
 * GET /api/v1/access/entitlements/batch accepts optional organization_unit_id
 * (routers/autos_core_access_router.py:442-481). Never send dealer_id.
 */

import { apiFetch } from "@/lib/api/fetch-client";
import { extractCreditHubReasonCode } from "@/lib/credit-hub/api/client";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";

export const ACCESS_ENDPOINTS = {
  batch: "/api/v1/access/entitlements/batch",
  readiness: "/api/v1/access/readiness",
  plans: "/api/v1/access/plans",
  subscription: "/api/v1/access/subscription",
} as const;

export const ACCESS_SCOPE_TENANT = "tenant" as const;
export const ACCESS_UNIT_SCOPE_INCLUDED = "included" as const;
export const ACCESS_UNIT_SCOPE_OMITTED = "omitted" as const;

export type AccessClientContext = {
  tenantId: string;
  dealerId: string | null;
  organizationUnitId: string | null;
};

export type AccessApiErrorEnvelope = {
  status: number;
  reason_code: string | null;
  detail: unknown | null;
  endpoint: string;
};

export class AccessApiError extends Error implements AccessApiErrorEnvelope {
  readonly status: number;
  readonly reason_code: string | null;
  readonly detail: unknown | null;
  readonly endpoint: string;
  constructor(envelope: AccessApiErrorEnvelope) {
    super(envelope.reason_code ?? `HTTP ${envelope.status}`);
    this.name = "AccessApiError";
    this.status = envelope.status;
    this.reason_code = envelope.reason_code;
    this.detail = envelope.detail;
    this.endpoint = envelope.endpoint;
  }
}

export class AccessTenantRequiredError extends Error {
  constructor() {
    super("Access request skipped: tenant context is required");
    this.name = "AccessTenantRequiredError";
  }
}

export type EntitlementBatchItem = {
  allowed: boolean;
  reason_code: string | null;
  limit: number | null;
  current_usage: number | null;
};

export type EntitlementsBatchPayload = { results: Record<string, EntitlementBatchItem> };
export type EntitlementsBatchResponse = EntitlementsBatchPayload & {
  scope: typeof ACCESS_SCOPE_TENANT;
  unitScope: typeof ACCESS_UNIT_SCOPE_INCLUDED | typeof ACCESS_UNIT_SCOPE_OMITTED;
};
export type AccessReadinessResponse = {
  entries: Array<{
    capability_key: string;
    status: string;
    is_usable: boolean;
    version: string | null;
    notes: string | null;
  }>;
  summary: Record<string, number>;
  total: number;
};
export type AccessPlansResponse = { plans: Array<Record<string, unknown>> };
export type AccessSubscriptionResponse = {
  has_subscription: boolean;
  subscription: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Sole HTTP-envelope → AccessApiError constructor. No status-to-reason fallback. */
export function accessApiErrorFromHttp(
  status: number,
  body: unknown,
  endpoint: string,
): AccessApiError {
  const root = asRecord(body);
  return new AccessApiError({
    status,
    reason_code: extractCreditHubReasonCode(body) ?? null,
    detail: root && "detail" in root ? root.detail : body,
    endpoint,
  });
}

export function getAccessClientContext(): AccessClientContext | null {
  const resolved = resolveDealerAccessContext();
  if (resolved.status === "no_tenant" || (resolved.status === "no_dealer" && !resolved.tenantId)) {
    return null;
  }
  if (resolved.status === "no_dealer") {
    return { tenantId: resolved.tenantId as string, dealerId: null, organizationUnitId: null };
  }
  if (resolved.status === "tenant_mismatch" || resolved.status === "no_organization_unit") {
    return {
      tenantId: resolved.tenantId,
      dealerId: resolved.dealerId,
      organizationUnitId: resolved.status === "no_organization_unit" ? null : resolved.organizationUnitId,
    };
  }
  return {
    tenantId: resolved.context.tenantId,
    dealerId: resolved.context.dealerId,
    organizationUnitId: resolved.context.organizationUnitId,
  };
}

export function accessQueryKey(
  endpoint: string,
  context: AccessClientContext | null,
): readonly [string, string, string, string, string] {
  return [
    "access",
    endpoint,
    context?.tenantId ?? "none",
    context?.dealerId ?? "none",
    context?.organizationUnitId ?? "none",
  ];
}

/** Never retry 4xx, 501, or TARGET_CORE_NOT_READY. One retry for other 5xx / network. */
export function shouldRetryAccessQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof AccessTenantRequiredError) return false;
  if (error instanceof AccessApiError) {
    if (error.status === 501 || (error.status >= 400 && error.status < 500)) return false;
    if (error.reason_code === "TARGET_CORE_NOT_READY") return false;
    return failureCount < 1;
  }
  return failureCount < 1;
}

function requestContext(explicit?: AccessClientContext | null): AccessClientContext {
  const context = explicit === undefined ? getAccessClientContext() : explicit;
  if (!context?.tenantId) throw new AccessTenantRequiredError();
  return context;
}

async function accessGet<T>(
  endpoint: string,
  context: AccessClientContext,
  search?: URLSearchParams,
): Promise<T> {
  const qs = search?.toString();
  const path = qs ? `${endpoint}?${qs}` : endpoint;
  const response = await apiFetch(path, {
    method: "GET",
    headers: { Accept: "application/json", "X-Tenant-ID": context.tenantId },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    throw accessApiErrorFromHttp(response.status, body, endpoint);
  }
  return body as T;
}

function batchSearch(
  capabilityKeys: string[],
  organizationUnitId: string | null,
): URLSearchParams | undefined {
  const keys = capabilityKeys.map((k) => k.trim()).filter(Boolean);
  const params = new URLSearchParams();
  if (keys.length > 0) params.set("capabilities", keys.join(","));
  const unit = organizationUnitId?.trim() || "";
  if (unit) params.set("organization_unit_id", unit);
  return params.toString() ? params : undefined;
}

export async function fetchEntitlementsBatch(
  capabilityKeys: string[] = [],
  explicitContext?: AccessClientContext | null,
): Promise<EntitlementsBatchResponse> {
  const context = requestContext(explicitContext);
  const unit = context.organizationUnitId?.trim() || "";
  const payload = await accessGet<EntitlementsBatchPayload>(
    ACCESS_ENDPOINTS.batch,
    context,
    batchSearch(capabilityKeys, unit || null),
  );
  return {
    ...payload,
    scope: ACCESS_SCOPE_TENANT,
    unitScope: unit ? ACCESS_UNIT_SCOPE_INCLUDED : ACCESS_UNIT_SCOPE_OMITTED,
  };
}

export async function fetchAccessReadiness(explicitContext?: AccessClientContext | null) {
  return accessGet<AccessReadinessResponse>(ACCESS_ENDPOINTS.readiness, requestContext(explicitContext));
}

export async function fetchAccessPlans(explicitContext?: AccessClientContext | null) {
  return accessGet<AccessPlansResponse>(ACCESS_ENDPOINTS.plans, requestContext(explicitContext));
}

export async function fetchAccessSubscription(explicitContext?: AccessClientContext | null) {
  return accessGet<AccessSubscriptionResponse>(
    ACCESS_ENDPOINTS.subscription,
    requestContext(explicitContext),
  );
}
