/** Autos dealer entitlements API client — Phase 1 frontend. */

import { AccessApiError, accessApiErrorFromHttp } from "@/lib/access/client";
import { getAuthHeaders, resolveApiUrl } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import {
  accessContextBody,
  accessContextHeaders,
  resolveDealerAccessContext,
  type DealerAccessContext,
} from "@/lib/dealer/access-context";
import type {
  DealerEntitlementContext,
  EntitlementDecision,
  EntitlementReasonCode,
} from "@/types/entitlements";
import { ENTITLEMENT_REASON_CODES } from "@/types/entitlements";

function decisionFromAccessError(error: AccessApiError): EntitlementDecision {
  const known = ENTITLEMENT_REASON_CODES.find((code) => code === error.reason_code);
  return { allowed: false, reason_code: known ?? "DEFAULT_DENY" };
}

function denied(reason_code: EntitlementReasonCode): EntitlementDecision {
  return { allowed: false, reason_code };
}

function readyContextOrDeny(): DealerAccessContext | EntitlementDecision {
  const resolved = resolveDealerAccessContext();
  if (resolved.status === "ready") return resolved.context;
  return denied(resolved.reason_code);
}

function isDealerAccessContext(
  value: DealerAccessContext | EntitlementDecision,
): value is DealerAccessContext {
  return "dealerId" in value && "organizationUnitId" in value;
}

function getAuthToken(): string {
  const v2 = tokenStorage.getAccessToken();
  if (v2) return v2;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("nadakki_sic_token") ?? "";
  }
  return "";
}

function authHeaders(context?: DealerAccessContext): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(context ? accessContextHeaders(context) : {}),
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    const legacy = getAuthHeaders();
    if (legacy.Authorization) headers.Authorization = legacy.Authorization;
  }
  return headers;
}

export const entitlementsAPI = {
  async checkAccess(
    capability_id: string,
    options?: { requested_units?: number; resource_id?: string },
  ): Promise<EntitlementDecision> {
    const gate = readyContextOrDeny();
    if (isDealerAccessContext(gate)) {
      try {
        const response = await fetch(resolveApiUrl("/api/v1/autos/entitlements/check"), {
          method: "POST",
          headers: authHeaders(gate),
          body: JSON.stringify({
            capability_id,
            requested_units: options?.requested_units ?? 1,
            resource_id: options?.resource_id,
            ...accessContextBody(gate),
          }),
        });

        if (!response.ok) {
          let body: unknown = null;
          try {
            body = await response.json();
          } catch {
            body = null;
          }
          return decisionFromAccessError(
            accessApiErrorFromHttp(response.status, body, "/api/v1/autos/entitlements/check"),
          );
        }

        return (await response.json()) as EntitlementDecision;
      } catch (error) {
        console.error("[Entitlements] checkAccess error:", error);
        return { allowed: false, reason_code: "DEFAULT_DENY" };
      }
    }
    return gate;
  },

  async getContext(): Promise<DealerEntitlementContext | null> {
    const result = await entitlementsAPI.getContextResult();
    return result.context;
  },

  async getContextResult(): Promise<{
    context: DealerEntitlementContext | null;
    reason_code: EntitlementReasonCode | null;
  }> {
    const resolved = resolveDealerAccessContext();
    if (resolved.status !== "ready") {
      return { context: null, reason_code: resolved.reason_code };
    }

    try {
      const response = await fetch(resolveApiUrl("/api/v1/autos/entitlements/context"), {
        headers: authHeaders(resolved.context),
      });

      if (!response.ok) {
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }
        const error = accessApiErrorFromHttp(
          response.status,
          body,
          "/api/v1/autos/entitlements/context",
        );
        return {
          context: null,
          reason_code: decisionFromAccessError(error).reason_code,
        };
      }

      return {
        context: (await response.json()) as DealerEntitlementContext,
        reason_code: null,
      };
    } catch (error) {
      console.error("[Entitlements] getContext error:", error);
      return { context: null, reason_code: "DEFAULT_DENY" };
    }
  },

  async getEffectiveCapabilities(
    dealerId: string,
  ): Promise<Record<string, { allowed: boolean; source: string; limits?: unknown }> | null> {
    const gate = readyContextOrDeny();
    if (isDealerAccessContext(gate) && gate.dealerId === dealerId.trim()) {
      try {
        const response = await fetch(
          resolveApiUrl(`/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/effective-capabilities`),
          { headers: authHeaders(gate) },
        );

        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as {
          capabilities?: Record<string, { allowed: boolean; source: string; limits?: unknown }>;
        };
        return payload.capabilities ?? null;
      } catch (error) {
        console.error("[Entitlements] getEffectiveCapabilities error:", error);
        return null;
      }
    }
    return null;
  },

  async recordUsage(
    capability_id: string,
    units = 1,
    idempotency_key?: string,
  ): Promise<{ recorded: boolean; reason?: string }> {
    try {
    const gate = readyContextOrDeny();
    if (isDealerAccessContext(gate)) {
      const response = await fetch(resolveApiUrl("/api/v1/autos/entitlements/usage"), {
        method: "POST",
        headers: authHeaders(gate),
        body: JSON.stringify({
          capability_id,
          units,
          idempotency_key,
          ...accessContextBody(gate),
        }),
      });

      if (!response.ok) {
        return { recorded: false, reason: "API_ERROR" };
      }

      return (await response.json()) as { recorded: boolean; reason?: string };
    }
    return { recorded: false, reason: gate.reason_code };
    } catch (error) {
      console.error("[Entitlements] recordUsage error:", error);
      return { recorded: false, reason: "NETWORK_ERROR" };
    }
  },
};
