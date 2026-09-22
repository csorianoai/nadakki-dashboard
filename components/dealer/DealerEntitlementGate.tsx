"use client";

import { useState, type ReactNode } from "react";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import type { EntitlementDecision, EntitlementReasonCode } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

const UPGRADE_ACTIONS = new Set(["upgrade_plan", "wait_or_upgrade", "enable_addon"]);

function asReason(value: string | null | undefined): EntitlementReasonCode {
  return (value || "DEFAULT_DENY") as EntitlementReasonCode;
}

function decisionFromBatch(
  capability: string,
  query: ReturnType<typeof useAccessEntitlementsBatch>,
): EntitlementDecision {
  if (query.error instanceof AccessApiError) {
    return {
      allowed: false,
      reason_code: asReason(query.error.reason_code),
      target_readiness: query.error.reason_code === "TARGET_CORE_NOT_READY" ? "BLOCKED" : undefined,
    };
  }
  const item = query.data?.results?.[capability];
  if (!item) return { allowed: false, reason_code: "DEFAULT_DENY" };
  if (item.reason_code === "TARGET_CORE_NOT_READY") {
    return { allowed: false, reason_code: "TARGET_CORE_NOT_READY", target_readiness: "BLOCKED" };
  }
  return {
    allowed: item.allowed === true,
    reason_code: asReason(item.reason_code ?? (item.allowed ? "ALLOWED" : "DEFAULT_DENY")),
    limit: item.limit ?? undefined,
    used: item.current_usage ?? undefined,
  };
}

export function DealerReasonPanel({
  reason_code,
  httpStatus,
  action,
}: {
  reason_code: string;
  httpStatus?: number;
  action?: ReactNode;
}) {
  const info = REASON_CODE_INFO[reason_code];
  const copy =
    reason_code === "TARGET_CORE_NOT_READY"
      ? "El core aún no está habilitado."
      : info?.description ?? "Esta superficie no está disponible.";
  return (
    <section
      role="alert"
      data-testid="dealer-reason-panel"
      data-reason-code={reason_code}
      data-http-status={httpStatus != null ? String(httpStatus) : undefined}
      data-allowed="false"
      className="max-w-full space-y-3 overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
    >
      <h2 className="font-manrope text-lg font-bold text-nk-fg">{info?.title ?? reason_code}</h2>
      <p className="text-sm text-nk-fg-muted">{copy}</p>
      <p className="text-xs font-semibold text-nk-fg">
        reason_code: <code>{reason_code}</code>
      </p>
      {action}
    </section>
  );
}

export function DealerEntitlementGate({
  capability,
  children,
}: {
  capability: string;
  children: (decision: EntitlementDecision) => ReactNode;
}) {
  const query = useAccessEntitlementsBatch([capability]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (query.isPending || query.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-surface-loading">
        Cargando acceso…
      </p>
    );
  }

  if (query.error instanceof AccessApiError) {
    return (
      <DealerReasonPanel
        reason_code={query.error.reason_code ?? `HTTP_${query.error.status}`}
        httpStatus={query.error.status}
      />
    );
  }

  if (query.error || !query.data?.results) {
    return <DealerReasonPanel reason_code="DEFAULT_DENY" />;
  }

  const decision = decisionFromBatch(capability, query);
  if (!decision.allowed) {
    const info = REASON_CODE_INFO[decision.reason_code];
    const canUpgrade = UPGRADE_ACTIONS.has(info?.action_required ?? "");
    return (
      <>
        <DealerReasonPanel
          reason_code={decision.reason_code}
          action={
            canUpgrade ? (
              <button
                type="button"
                className="min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg"
                onClick={() => setUpgradeOpen(true)}
              >
                Ver planes publicados
              </button>
            ) : info?.action_required === "contact_admin" ? (
              <p className="text-sm text-nk-fg">Contacta a tu administrador para desbloquear.</p>
            ) : null
          }
        />
        {upgradeOpen ? (
          <UpgradeModal decision={decision} onClose={() => setUpgradeOpen(false)} />
        ) : null}
      </>
    );
  }

  return <>{children(decision)}</>;
}
