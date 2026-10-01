/**
 * Formato de cifras con el locale y la moneda del TENANT, nunca fijos.
 * La ficha lo marca explicitamente: Excursions muestra "$82,554" en en-US;
 * Mapaal debe ver "$ 82.554,00" en es-AR/ARS.
 */

export type LocaleTenant = { locale: string; currency: string | null };

/**
 * Fallback neutro mientras no ha llegado el branding del tenant.
 * La moneda NO tiene fallback: ausencia de currency queda representada como null.
 */
export const LOCALE_POR_DEFECTO: LocaleTenant = { locale: "es", currency: null };

export function localeDeTenant(branding: {
  locale?: string | null;
  currency?: string | null;
} | null | undefined): LocaleTenant {
  const locale = branding?.locale?.trim();
  const currency = branding?.currency?.trim();
  return {
    locale: locale || LOCALE_POR_DEFECTO.locale,
    currency: currency ? currency.toUpperCase() : null,
  };
}

export function formateaEntero(valor: number, { locale }: LocaleTenant): string {
  return new Intl.NumberFormat(locale).format(valor);
}

export function formateaMoneda(valor: number, { locale, currency }: LocaleTenant): string {
  if (!currency) {
    throw new Error("TENANT_CURRENCY_NOT_CONFIGURED");
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(valor);
}

/** "12 días" / "1 día", con el numero formateado por locale. */
export function formateaDias(dias: number, locale: LocaleTenant): string {
  return `${formateaEntero(dias, locale)} ${dias === 1 ? "día" : "días"}`;
}

/** Argentina: el paquete contable no aplica (ficha + DealerModuleGrid). */
export function esArgentina(branding: {
  locale?: string | null;
  currency?: string | null;
} | null | undefined): boolean {
  const locale = branding?.locale?.toLowerCase() ?? "";
  const currency = branding?.currency?.toUpperCase() ?? "";
  return currency === "ARS" || locale.endsWith("-ar");
}
