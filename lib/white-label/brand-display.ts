/**
 * White-label display helpers — FASE 3.
 * Never fall back to "Nadakki" for external tenants; use neutral copy or API branding.
 */

export const NEUTRAL_PLATFORM_TITLE = "Plataforma de crédito";
export const NEUTRAL_SUITE_LABEL = "Suite operativa";
export const NEUTRAL_LOGIN_FOOTER = "Acceso multi-institución";
export const NEUTRAL_FORGE_PRODUCT = "Forge";

export function resolveBrandDisplayName(
  branding: { display_name?: string | null } | null | undefined,
  tenant: { display_name?: string | null } | null | undefined,
): string | null {
  const fromBranding = branding?.display_name?.trim();
  if (fromBranding) return fromBranding;
  const fromTenant = tenant?.display_name?.trim();
  if (fromTenant) return fromTenant;
  return null;
}

/** Visible title: tenant branding when available, else neutral (never "Nadakki"). */
export function resolveVisiblePlatformTitle(
  branding: { display_name?: string | null } | null | undefined,
  tenant: { display_name?: string | null } | null | undefined,
): string {
  return resolveBrandDisplayName(branding, tenant) ?? NEUTRAL_PLATFORM_TITLE;
}

export function resolveForgeWordmarkLabel(
  branding: { display_name?: string | null } | null | undefined,
  tenant: { display_name?: string | null } | null | undefined,
): string {
  const name = resolveBrandDisplayName(branding, tenant);
  if (!name) return NEUTRAL_FORGE_PRODUCT;
  return `${name} ${NEUTRAL_FORGE_PRODUCT}`;
}

export function brandInitial(label: string | null | undefined): string {
  const t = label?.trim();
  if (!t) return "·";
  return t.charAt(0).toUpperCase();
}

export function consentDataPolicyLabel(institutionName: string): string {
  return `Política de tratamiento de datos de ${institutionName}`;
}

export function consentFooterBrand(institutionName: string): string {
  return `la plataforma segura de consentimiento ${institutionName}`;
}

export function consentCheckboxDataPolicy(institutionName: string): string {
  return `Acepto la política de tratamiento de datos de ${institutionName}`;
}

export function pwaInstallTitle(displayName: string | null | undefined): string {
  const name = displayName?.trim();
  return name ? `Instalar ${name}` : "Instalar aplicación";
}
