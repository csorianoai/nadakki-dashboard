/**
 * Tenant branding contract — mirrors `_API_CONTRACT.md` § "TENANT BRANDING ENDPOINT"
 * verbatim. Do not extend without updating the API contract first.
 *
 * Source: GET /api/v2/tenants/{tenant_id}/branding
 *
 * @see _API_CONTRACT.md (root of repo) for response shape and field semantics.
 */
export interface TenantBranding {
  /** Stable tenant identifier (slug or UUID, depending on backend). */
  tenant_id: string;
  /** Human-facing institution name (e.g. "Credicefi", "Banco Piloto RD"). */
  display_name: string;
  /** HTTPS URL to the institution logo (SVG preferred). May be null if not configured. */
  logo_url: string | null;
  /** Institutional primary color, hex (e.g. "#1B4A8C"). Maps to --forge-brand-500. */
  brand_primary: string;
  /** Institutional dark color, hex (e.g. "#081E3D"). Maps to --forge-brand-900. */
  brand_dark: string;
  /** BCP 47 locale tag (e.g. "es-DO", "en-US"). */
  locale: string;
  /** ISO 4217 currency code (e.g. "DOP", "USD", "MXN"). */
  currency: string;
  /** Regulatory profile string (e.g. "INDOTEL", "DO_LEY_172_13", "MX_CNBV"). */
  regulatory_profile: string;
  /** Map of canonical application status keys to localized labels. */
  application_status_labels: TenantBrandingStatusLabels;
  /** Per-tenant copy overrides keyed by stable string id. */
  copy_overrides: Record<string, string>;

  /** Optional extras (P11-05+) — tolerated when omitted in older payloads. */
  accent_color?: string;
  secondary_color?: string;
  /** Optional raw CSS applied by advanced tenants (backend contract P11-05). */
  custom_css?: string;
  /** Web font stack name e.g. "Inter", applied as primary UI font alongside fallbacks. */
  font_family?: string | null;
  dark_mode_enabled?: boolean;
}

/**
 * Localized labels for the canonical application status state machine.
 * All keys are required from the backend; consumers must default safely
 * if a key is missing (defensive against schema drift).
 */
export interface TenantBrandingStatusLabels {
  DRAFT: string;
  SUBMITTED: string;
  PENDING_REVIEW: string;
  APPROVED: string;
  REJECTED: string;
}
