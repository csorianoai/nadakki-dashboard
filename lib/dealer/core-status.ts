/**
 * Core cards: readinessKey is 097-catalog only and never an entitlement.
 * actionCapability is the CTA batch key and never a proxy for core state.
 * READY = readiness is_usable && status is operable. Batch does not set READY.
 */

export const MIGRATION_097_CAPABILITY_KEYS = new Set([
  "autos.inventory.list",
  "autos.inventory.create",
  "autos.inventory.photos",
  "autos.inventory.video",
  "autos.inventory.storage",
  "autos.leads.capture",
  "autos.leads.crm",
  "autos.leads.export",
  "autos.search.marketplace",
  "autos.search.visibility",
  "autos.whatsapp.messages",
  "autos.users.seats",
  "autos.financing.calculator",
  "autos.financing.applications",
  "autos.analytics.basic",
  "autos.analytics.advanced",
  "autos.api.access",
  "autos.webhooks",
  "autos.white_label",
  "marketing.social.publish",
  "marketing.social.schedule",
  "marketing.content.generate",
  "marketing.ads.manage",
  "marketing.ads.budget",
  "marketing.audience.segment",
  "marketing.analytics.reports",
  "marketing.email.campaigns",
  "marketing.autopilot",
  "marketing.brand.assets",
  "marketing.intelligence",
  "legal.cases.create",
  "legal.cases.view",
  "legal.documents.generate",
  "legal.compliance.check",
  "legal.sic.expedientes",
  "legal.sic.evidence",
  "legal.contracts.templates",
  "credit.applications.submit",
  "credit.applications.view",
  "credit.scoring.run",
  "credit.documents.upload",
  "credit.banks.popular",
  "credit.banks.reservas",
  "credit.banks.scotiabank",
  "credit.reports.generate",
  "accounting.invoices.create",
  "accounting.invoices.view",
  "accounting.reports.financial",
  "accounting.tax.itbis",
  "accounting.ledger.entries",
  "accounting.reconciliation",
]);

export const NO_CATALOG_CAPABILITY_REASON = "sin capability en catalogo";

export const DEALER_CORE_STATUS_ROWS = [
  {
    name: "Dealer-Bank",
    readinessKey: "credit.applications.view",
    actionCapability: "credit.applications.submit",
    href: "/credit-hub/dealer",
  },
  {
    name: "Legal",
    readinessKey: "legal.cases.view",
    actionCapability: "legal.cases.create",
    href: "/legal/contracts",
  },
  {
    name: "Marketing",
    readinessKey: "marketing.social.publish",
    actionCapability: "marketing.ads.manage",
    href: "/marketing/campaigns",
  },
  {
    name: "Contable",
    readinessKey: "accounting.invoices.view",
    actionCapability: "accounting.invoices.create",
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
  readinessKey: string | null;
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

  const readinessKey = input.readinessKey?.trim() || "";
  if (!readinessKey || !MIGRATION_097_CAPABILITY_KEYS.has(readinessKey)) {
    return {
      state: "NOT_READY",
      reason_code: null,
      reason: NO_CATALOG_CAPABILITY_REASON,
      action: null,
    };
  }

  if (!input.entry) {
    return {
      state: "NOT_READY",
      reason_code: null,
      reason: "Readiness no devolvió esta capability. El core no está habilitado para operar.",
      action: null,
    };
  }

  const status = input.entry.status;
  const notes = input.entry.notes?.trim() || null;
  const usable = input.entry.is_usable === true;
  const batchReason = input.batch?.reason_code ?? null;
  const allowed = input.batch?.allowed === true;

  if (status === "BLOCKED") {
    return {
      state: "BLOCKED",
      reason_code: null,
      reason: notes ?? "El core está bloqueado en readiness.",
      action: "contact_admin",
    };
  }

  const readyDeclared = usable && !NOT_READY_STATUSES.has(status);
  if (!readyDeclared) {
    return {
      state: "NOT_READY",
      reason_code: null,
      reason: notes ?? `Readiness ${status}. El core no está habilitado para operar.`,
      action: null,
    };
  }

  const action = allowed
    ? "open"
    : UPGRADE_REASONS.has(batchReason ?? "")
      ? "upgrade"
      : "contact_admin";

  return {
    state: "READY",
    reason_code: batchReason,
    reason: notes ?? "Readiness declara el core usable.",
    action,
  };
}
