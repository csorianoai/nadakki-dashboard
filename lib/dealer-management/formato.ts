/**
 * Formato de cifras con el locale y la moneda del TENANT, nunca fijos.
 * La ficha lo marca explicitamente: Excursions muestra "$82,554" en en-US;
 * Mapaal debe ver "$ 82.554,00" en es-AR/ARS.
 */

export type LocaleTenant = { locale: string; currency: string };

/** Fallback neutro mientras no ha llegado el branding del tenant. */
export const LOCALE_POR_DEFECTO: LocaleTenant = { locale: "es", currency: "USD" };

export function localeDeTenant(branding: {
  locale?: string | null;
  currency?: string | null;
} | null | undefined): LocaleTenant {
  const locale = branding?.locale?.trim();
  const currency = branding?.currency?.trim();
  if (!locale && !currency) return LOCALE_POR_DEFECTO;
  return {
    locale: locale || LOCALE_POR_DEFECTO.locale,
    currency: (currency || LOCALE_POR_DEFECTO.currency).toUpperCase(),
  };
}

export function formateaEntero(valor: number, { locale }: LocaleTenant): string {
  return new Intl.NumberFormat(locale).format(valor);
}

export function formateaMoneda(valor: number, { locale, currency }: LocaleTenant): string {
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
