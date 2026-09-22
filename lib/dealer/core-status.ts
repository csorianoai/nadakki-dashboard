/**
 * Derive dealer core UI state from GET /api/v1/access/readiness + entitlements batch.
 * READY only when the backend says the capability is usable AND batch allows it.
 */

export const DEALER_CORE_STATUS_ROWS = [
  {
    name: "Dealer-Bank",
    capability: "credit.applications.create",
    href: "/credit-hub/dealer",
  },
  {
    name: "Legal",
    capability: "legal.quick_check",
    href: "/legal/contracts",
  },
  {
    name: "Marketing",
    capability: "marketing.campaigns.create",
    href: "/marketing/campaigns",
  },
  {
    name: "Contable",
    capability: "accounting.commissions.view",
    href: "/contable",
  },
] as const;

export type DealerCoreUiState = "READY" | "BLOCKED" | "NOT_READY" | "ERROR";

export type ReadinessEntryLike = {
  capability_key: string;
  status: string;
  is_usable: boolean;
  version: string | null;
  notes: string | null;
};

export type BatchItemLike = {
  allowed: boolean;
  reason_code: string | null;
};

const NOT_READY_STATUSES = new Set([
  "NOT_IMPLEMENTED",
  "COMPONENT_ONLY",
  "PENDING_EXTERNAL_ACTIVATION",
]);

const UPGRADE_REASONS = new Set([
  "UPGRADE_REQUIRED",
  "NO_ACTIVE_SUBSCRIPTION",
  "LIMIT_REACHED",
  "ADD_ON_REQUIRED",
]);

export function deriveDealerCoreUiState(input: {
  accessError: boolean;
  entry: ReadinessEntryLike | null;
  batch: BatchItemLike | null;
}): {
  state: DealerCoreUiState;
  reason_code: string | null;
  reason: string;
  action: "open" | "upgrade" | "contact_admin" | null;
} {
  if (input.accessError) {
    return {
      state: "ERROR",
      reason_code: null,
      reason: "No se pudo leer readiness o entitlements.",
      action: null,
    };
  }

  const status = input.entry?.status ?? "NOT_IMPLEMENTED";
  const usable = input.entry?.is_usable === true;
  const notes = input.entry?.notes?.trim() || null;
  const batchReason = input.batch?.reason_code ?? null;
  const allowed = input.batch?.allowed === true;

  if (status === "BLOCKED") {
    return {
      state: "BLOCKED",
      reason_code: batchReason,
      reason: notes ?? "El core está bloqueado en readiness.",
      action: "contact_admin",
    };
  }

  if (!usable || NOT_READY_STATUSES.has(status) || batchReason === "TARGET_CORE_NOT_READY") {
    return {
      state: "NOT_READY",
      reason_code: batchReason === "TARGET_CORE_NOT_READY" ? "TARGET_CORE_NOT_READY" : null,
      reason: notes ?? `Readiness ${status}. El core no está habilitado para operar.`,
      action: null,
    };
  }

  if (usable && allowed) {
    return {
      state: "READY",
      reason_code: batchReason,
      reason: notes ?? "El backend declara el core usable y el batch lo permite.",
      action: "open",
    };
  }

  return {
    state: "BLOCKED",
    reason_code: batchReason,
    reason: notes ?? "El core está servible pero la membresía no lo concede.",
    action: UPGRADE_REASONS.has(batchReason ?? "") ? "upgrade" : "contact_admin",
  };
}
