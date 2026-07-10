/** Wizard paso 2 — exact branding keys from TenantBranding contract (F0). */
export interface TenantBrandingPayload {
  display_name: string;
  logo_url: string | null;
  brand_primary: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  locale: string;
  currency: string;
  plan_id?: string;
  plan_name?: string;
  status: "active" | "suspended" | "pending";
  core_codes?: string[];
  branding?: TenantBrandingPayload;
}

export interface PlanRecord {
  id: string;
  name: string;
  description?: string;
}

export interface CoreRegistryItem {
  code: string;
  display_name: string;
}

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  role_key: string;
  tenant_id: string;
  core_codes?: string[];
}

export interface AuthRole {
  role_key: string;
  display_name: string;
}

export const SLUG_REGEX = /^[a-z0-9-]+$/;
export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function validateBranding(b: TenantBrandingPayload): string | null {
  if (!b.display_name || b.display_name.length < 1 || b.display_name.length > 80) {
    return "display_name: 1–80 caracteres";
  }
  if (!HEX_COLOR_REGEX.test(b.brand_primary)) return "brand_primary: hex #RRGGBB de 6 dígitos";
  if (b.logo_url) {
    try {
      new URL(b.logo_url);
    } catch {
      return "logo_url: URL inválida";
    }
  }
  return null;
}

export function validateSlug(slug: string): string | null {
  if (slug.length < 3 || slug.length > 40) return "Slug: 3–40 caracteres";
  if (!SLUG_REGEX.test(slug)) return "Slug: solo a-z, 0-9 y guión";
  return null;
}
