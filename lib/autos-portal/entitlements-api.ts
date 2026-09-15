/** Autos dealer entitlements API client — Phase 1 frontend. */

import { getAuthHeaders, resolveApiUrl } from "@/lib/api/fetch-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { isTenantSlug, TENANTS } from "@/lib/tenants";
import type {
  DealerEntitlementContext,
  EntitlementDecision,
  EntitlementReasonCode,
} from "@/types/entitlements";
import { ENTITLEMENT_REASON_CODES } from "@/types/entitlements";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function knownReasonCode(value: unknown): EntitlementReasonCode | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return ENTITLEMENT_REASON_CODES.find((code) => code === normalized);
}

export function reasonCodeFromEntitlementError(
  body: unknown,
  status: number,
): EntitlementReasonCode {
  const root = asRecord(body);
  const detail = asRecord(root?.detail);
  const fromEnvelope =
    knownReasonCode(root?.reason_code) ||
    knownReasonCode(root?.error_code) ||
    knownReasonCode(root?.error) ||
    knownReasonCode(detail?.reason_code) ||
    knownReasonCode(detail?.error_code) ||
    knownReasonCode(detail?.error);
  if (fromEnvelope) return fromEnvelope;
  if (status === 501) return "TARGET_CORE_NOT_READY";
  return "DEFAULT_DENY";
}

function getTenantId(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? TENANTS.nadakki.tenantId;
  }

  const stored = window.localStorage.getItem("nadakki_tenant_id");
  if (stored) return stored;

  const slug =
    document.documentElement.getAttribute("data-tenant") ??
    window.localStorage.getItem("nadakki-autos-tenant");
  if (slug && isTenantSlug(slug)) return TENANTS[slug].tenantId;

  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? TENANTS.nadakki.tenantId;
}

function getAuthToken(): string {
  const v2 = tokenStorage.getAccessToken();
  if (v2) return v2;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("nadakki_sic_token") ?? "";
  }
  return "";
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": getTenantId(),
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
    try {
      const response = await fetch(resolveApiUrl("/api/v1/autos/entitlements/check"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          capability_id,
          requested_units: options?.requested_units ?? 1,
          resource_id: options?.resource_id,
        }),
      });

      if (!response.ok) {
        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }
        return {
          allowed: false,
          reason_code: reasonCodeFromEntitlementError(body, response.status),
        };
      }

      return (await response.json()) as EntitlementDecision;
    } catch (error) {
      console.error("[Entitlements] checkAccess error:", error);
      return { allowed: false, reason_code: "DEFAULT_DENY" };
    }
  },

  async getContext(): Promise<DealerEntitlementContext | null> {
    try {
      const response = await fetch(resolveApiUrl("/api/v1/autos/entitlements/context"), {
        headers: authHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as DealerEntitlementContext;
    } catch (error) {
      console.error("[Entitlements] getContext error:", error);
      return null;
    }
  },

  async getEffectiveCapabilities(
    dealerId: string,
  ): Promise<Record<string, { allowed: boolean; source: string; limits?: unknown }> | null> {
    try {
      const response = await fetch(
        resolveApiUrl(`/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/effective-capabilities`),
        { headers: authHeaders() },
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
  },

  async recordUsage(
    capability_id: string,
    units = 1,
    idempotency_key?: string,
  ): Promise<{ recorded: boolean; reason?: string }> {
    try {
      const response = await fetch(resolveApiUrl("/api/v1/autos/entitlements/usage"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          capability_id,
          units,
          idempotency_key,
        }),
      });

      if (!response.ok) {
        return { recorded: false, reason: "API_ERROR" };
      }

      return (await response.json()) as { recorded: boolean; reason?: string };
    } catch (error) {
      console.error("[Entitlements] recordUsage error:", error);
      return { recorded: false, reason: "NETWORK_ERROR" };
    }
  },
};
