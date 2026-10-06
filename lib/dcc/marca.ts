import { localeDeTenant, type LocaleTenant } from "@/lib/dcc/formato";
import { DCC_PRODUCTOS, type ProductoDcc } from "@/lib/dcc/producto";

/**
 * Marca de la cabecera del DCC. Nombre, logo, locale y moneda salen SOLO del
 * branding del tenant (GET /api/v2/tenants/{id}/branding): lo que el backend no
 * manda queda en null y no se pinta.
 *
 * `plataforma` es la firma del PRODUCTO (lib/dcc/producto.ts), no un dato del
 * tenant: decision de Cesar en la R1. Sin producto, la del dealer.
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

export function marcaDesdeBranding(branding: unknown, producto: ProductoDcc = "dealer"): MarcaDcc {
  const rec = branding && typeof branding === "object" ? (branding as Record<string, unknown>) : {};
  const logo = texto(rec.logo_url);
  return {
    nombre: texto(rec.display_name),
    plataforma: DCC_PRODUCTOS[producto].firma,
    logoUrl: logo && /^https:\/\//i.test(logo) ? logo : null,
    formato: localeDeTenant({ locale: texto(rec.locale), currency: texto(rec.currency) }),
  };
}
