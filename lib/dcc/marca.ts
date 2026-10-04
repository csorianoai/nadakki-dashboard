import { localeDeTenant, type LocaleTenant } from "@/lib/dcc/formato";

/**
 * Marca de la cabecera del DCC, tomada SOLO del branding del tenant
 * (GET /api/v2/tenants/{id}/branding). Nada escrito a mano: lo que el backend no
 * manda queda en null y no se pinta.
 *
 * `plataforma` ("con Nadakki Dealer OS") lee `platform_label`. HOY el backend
 * NO lo envia (schemas/tenant_branding.py:76-96 en nadakki-ai-suite): la linea
 * no aparece hasta que exista ese campo. Es un hueco declarado de la R1.
 */
export type MarcaDcc = {
  nombre: string | null;
  plataforma: string | null;
  logoUrl: string | null;
  formato: LocaleTenant;
};

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

export function marcaDesdeBranding(branding: unknown): MarcaDcc {
  const rec = branding && typeof branding === "object" ? (branding as Record<string, unknown>) : {};
  const logo = texto(rec.logo_url);
  return {
    nombre: texto(rec.display_name),
    plataforma: texto(rec.platform_label),
    logoUrl: logo && /^https:\/\//i.test(logo) ? logo : null,
    formato: localeDeTenant({ locale: texto(rec.locale), currency: texto(rec.currency) }),
  };
}
