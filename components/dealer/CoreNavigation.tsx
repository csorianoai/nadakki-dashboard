"use client";

import Link from "next/link";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import {
  ACCESS_SCOPE_TENANT,
  ACCESS_UNIT_SCOPE_UNAVAILABLE,
  AccessApiError,
} from "@/lib/access/client";
import { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
import type { EntitlementDecision, EntitlementReasonCode } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

/** Hub batch keys: 097 catalog only. Invented *.view/*.create/*.quick_check are not billed. */
export const CORE_NAV_CAPABILITIES: Record<string, string> = {
  Inventory: "autos.inventory.list",
  Leads: "autos.leads.crm",
  Financing: "autos.financing.applications",
  Offers: "autos.search.marketplace",
  Commissions: "autos.analytics.basic",
  Marketing: "marketing.email.campaigns",
  Legal: "legal.contracts.templates",
  "Dealer-Bank": "credit.applications.submit",
  Accounting: "accounting.invoices.view",
};

const CORE_HREFS: Record<string, string> = {
  Inventory: "/autos/dealer/publicar-rapido",
  Leads: "/autos/dealer/leads",
  Financing: "/autos/vehiculos",
  Offers: "/autos/dashboard/mis-leads",
  Commissions: "/autos/dealer/insights",
  Marketing: "/marketing/campaigns",
  Legal: "/legal/contracts",
  "Dealer-Bank": "/credit-hub/dealer",
  Accounting: "/contable",
};

export const CORE_NAV_CAPABILITY_KEYS = Object.values(CORE_NAV_CAPABILITIES);

/** Privileged hub cards — capabilities taken from CORE_NAV, not invented. */
export const DEALER_QUICK_LINK_CAPABILITIES = {
  [CORE_HREFS.Inventory]: CORE_NAV_CAPABILITIES.Inventory,
  [CORE_HREFS.Leads]: CORE_NAV_CAPABILITIES.Leads,
  [CORE_HREFS.Commissions]: CORE_NAV_CAPABILITIES.Commissions,
} as const;

export function isAccessQueryFailClosed(query: {
  isError: boolean;
  error: unknown;
  isPending?: boolean;
  isLoading?: boolean;
  data?: { results?: Record<string, unknown> } | undefined;
}): boolean {
  if (query.error || query.isError) return true;
  if (query.isPending || query.isLoading) return true;
  if (!query.data || query.data.results == null || typeof query.data.results !== "object") {
    return true;
  }
  return false;
}

function asReason(value: string | null | undefined): EntitlementReasonCode {
  return (value || "DEFAULT_DENY") as EntitlementReasonCode;
}

/** HTTP kind only — body reason_code stays on AccessApiError from lib/access/client.ts. */
function accessErrorKind(status: number): "auth" | "denied" | "conflict" | "validation" | "error" {
  if (status === 401) return "auth";
  if (status === 403) return "denied";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  return "error";
}

function accessErrorCopy(error: AccessApiError): string {
  if (typeof error.detail === "string" && error.detail.trim()) return error.detail;
  if (error.reason_code) return error.reason_code;
  if (error.status === 401) return "Session expired";
  if (error.status === 422) return "Validation error";
  if (error.status === 409) return "State conflict";
  if (error.status === 403) return "Access denied";
  return error.message;
}

function decisionFor(
  capabilityId: string,
  query: ReturnType<typeof useAccessEntitlementsBatch>,
): EntitlementDecision {
  if (query.error instanceof AccessApiError) {
    return { allowed: false, reason_code: asReason(query.error.reason_code) };
  }
  const item = query.data?.results[capabilityId];
  if (!item) return { allowed: false, reason_code: "DEFAULT_DENY" };
  if (item.reason_code === "TARGET_CORE_NOT_READY") {
    return {
      allowed: false,
      reason_code: "TARGET_CORE_NOT_READY",
      target_readiness: "BLOCKED",
    };
  }
  return {
    allowed: item.allowed === true,
    reason_code: asReason(item.reason_code ?? (item.allowed ? "ALLOWED" : "DEFAULT_DENY")),
    limit: item.limit ?? undefined,
    used: item.current_usage ?? undefined,
  };
}

interface NavItem {
  label: string;
  href: string;
  capability_id: string;
  decision: EntitlementDecision;
}

export function CoreNavigation() {
  const query = useAccessEntitlementsBatch(CORE_NAV_CAPABILITY_KEYS);
  const accessScope = query.data?.scope ?? ACCESS_SCOPE_TENANT;
  const unitScope = query.error
    ? ACCESS_UNIT_SCOPE_UNAVAILABLE
    : (query.data?.unitScope ?? ACCESS_UNIT_SCOPE_UNAVAILABLE);
  const items: NavItem[] = Object.entries(CORE_NAV_CAPABILITIES).map(([label, capability_id]) => ({
    label,
    href: CORE_HREFS[label] ?? `/autos/dealer/${label.toLowerCase()}`,
    capability_id,
    decision: decisionFor(capability_id, query),
  }));

  if (query.isLoading) {
    return <p className="animate-pulse text-sm text-nk-fg-muted">Cargando capacidades…</p>;
  }

  if (query.error instanceof AccessApiError) {
    const kind = accessErrorKind(query.error.status);
    return (
      <nav
        className="space-y-2"
        data-testid="core-navigation"
        data-access-scope={accessScope}
        data-unit-scope={unitScope}
        data-dealer-authorized="false"
        data-allowed="false"
        data-http-status={String(query.error.status)}
        data-access-error={kind}
        data-reason-code={query.error.reason_code ?? ""}
      >
        <div
          className="rounded-r-sm border border-nk-border bg-nk-surface-2 p-3 text-sm text-nk-fg"
          data-access-error={kind}
          data-http-status={String(query.error.status)}
          data-reason-code={query.error.reason_code ?? ""}
          data-allowed="false"
          role="alert"
        >
          {accessErrorCopy(query.error)}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="space-y-2"
      data-testid="core-navigation"
      data-access-scope={accessScope}
      data-unit-scope={unitScope}
      data-dealer-authorized="false"
    >
      {items.map((item) => (
        <NavItemRenderer key={item.capability_id} item={item} />
      ))}
    </nav>
  );
}

function NavItemRenderer({ item }: { item: NavItem }) {
  const { label, href, decision } = item;
  const info = REASON_CODE_INFO[decision.reason_code];

  if (decision.target_readiness === "BLOCKED" || decision.reason_code === "TARGET_CORE_NOT_READY") {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-r-sm border border-nk-border bg-nk-surface-2 p-3 text-nk-fg-muted"
        data-reason-code={decision.reason_code}
        data-allowed="false"
        title={`${label} — ${info?.description ?? decision.reason_code}`}
      >
        <span>🔒 {label}</span>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
          Coming Soon
        </span>
      </div>
    );
  }

  if (!decision.allowed) {
    /**
     * `isAccessUnverified` en vez de comparar el codigo a mano.
     *
     * Esta linea comparaba contra "NO_ORGANIZATION_UNIT" en MAYUSCULAS y el
     * backend lo emite en minusculas (services/access/entitlements.py:65-66): la
     * rama NUNCA entraba, y el badge caia a "Locked" --o sea, "no tienes
     * permiso"-- cuando lo cierto es que el motor no pudo evaluar. Ademas se
     * perdia `no_beneficiary_entitlement`, que es la misma situacion.
     */
    const sinVerificar = isAccessUnverified(decision.reason_code);
    const badge =
      decision.reason_code === "LIMIT_REACHED"
        ? "Limit Hit"
        : sinVerificar
          ? "Sin verificar"
          : "Locked";

    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-r-sm border border-nk-border bg-nk-surface-2 p-3 text-nk-fg-muted"
        data-reason-code={decision.reason_code}
        data-allowed="false"
        data-unverified={sinVerificar ? "true" : undefined}
        title={sinVerificar ? ACCESS_UNVERIFIED_MESSAGE : (info?.description ?? decision.reason_code)}
      >
        <span>
          🔒 {label}{" "}
          {decision.reason_code === "LIMIT_REACHED" && decision.used != null && decision.limit != null ? (
            <span className="ml-2 text-xs text-red-600">
              ({decision.used} / {decision.limit} used)
            </span>
          ) : null}
        </span>
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
          {badge}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      data-reason-code={decision.reason_code}
      data-allowed="true"
      data-dealer-authorized="false"
      className="flex items-center justify-between rounded-r-sm border border-brand-2/30 bg-brand-2/5 p-3 text-nk-fg transition hover:bg-brand-2/10"
    >
      <span>
        ✅ {label}{" "}
        {decision.limit != null ? (
          <span className="ml-2 text-xs text-nk-fg-muted">
            ({decision.used ?? 0} / {decision.limit} used this month)
          </span>
        ) : null}
      </span>
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
        Available
      </span>
    </Link>
  );
}
