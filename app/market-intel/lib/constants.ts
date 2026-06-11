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

export const RUN_STATUS_LABELS: Record<
  "draft" | "researching" | "needs_validation" | "validated",
  string
> = {
  draft: "Borrador",
  researching: "Investigando",
  needs_validation: "Pendiente de validación",
  validated: "Validado",
};

export const TIER_COLORS: Record<string, string> = {
  T1: "var(--mee-tier-1, #0d9488)",
  T2: "var(--mee-tier-2, #0891b2)",
  T3: "var(--mee-tier-3, #6366f1)",
};
