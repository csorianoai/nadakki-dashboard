export const COUNTRY_OPTIONS = [
  { iso: "DO", label: "República Dominicana" },
  { iso: "PR", label: "Puerto Rico" },
  { iso: "MX", label: "México" },
] as const;

export const VERTICAL_OPTIONS = [
  { value: "consumer_credit", label: "Crédito de consumo" },
  { value: "sme_lending", label: "Crédito PYME" },
  { value: "mortgage", label: "Hipotecario" },
  { value: "auto_finance", label: "Financiamiento vehicular" },
] as const;

export const PRODUCT_OPTIONS = [
  { value: "personal_loan", label: "Préstamo personal" },
  { value: "auto_loan", label: "Préstamo vehicular" },
  { value: "working_capital", label: "Capital de trabajo" },
  { value: "credit_card", label: "Tarjeta de crédito" },
] as const;

export const INSTITUTION_TYPE_OPTIONS = [
  { value: "commercial_bank", label: "Banco comercial" },
  { value: "savings_bank", label: "Banco de ahorro y crédito" },
  { value: "cooperative", label: "Cooperativa" },
  { value: "nbfc", label: "Originador no bancario" },
] as const;

import type { KnownRunStatus } from "./types";

export const RUN_STATUS_LABELS: Record<KnownRunStatus, string> = {
  draft: "Borrador",
  researching: "Investigando",
  needs_validation: "Pendiente de validación",
  validated: "Validado",
};

const KNOWN_RUN_STATUSES = new Set<string>(Object.keys(RUN_STATUS_LABELS));

export function isKnownRunStatus(status: string): status is KnownRunStatus {
  return KNOWN_RUN_STATUSES.has(status);
}

export function getRunStatusLabel(status: string): string {
  if (isKnownRunStatus(status)) return RUN_STATUS_LABELS[status];
  return status.replace(/_/g, " ");
}

const KNOWN_STATUS_STYLES: Record<KnownRunStatus, string> = {
  draft: "bg-forgeGray-100 text-forgeGray-700 border-forgeGray-200",
  researching: "bg-forgeInfo-50 text-forgeInfo-700 border-forgeInfo-500/30",
  needs_validation: "bg-forgeWarning-50 text-forgeWarning-700 border-forgeWarning-500/30",
  validated: "bg-forgeSuccess-50 text-forgeSuccess-700 border-forgeSuccess-500/30",
};

const UNKNOWN_STATUS_STYLE =
  "bg-forgeNeutral-50 text-forgeNeutral-700 border-forgeNeutral-500/30";

export function getRunStatusStyle(status: string): string {
  if (isKnownRunStatus(status)) return KNOWN_STATUS_STYLES[status];
  return UNKNOWN_STATUS_STYLE;
}

export const TIER_COLORS: Record<string, string> = {
  T1: "var(--mee-tier-1, #0d9488)",
  T2: "var(--mee-tier-2, #0891b2)",
  T3: "var(--mee-tier-3, #6366f1)",
};
