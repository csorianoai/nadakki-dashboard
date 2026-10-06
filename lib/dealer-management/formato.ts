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

/**
 * Fecha con el formato del tenant: dd/mm/aaaa en es-AR. Una fecha SIN hora
 * ("2026-10-05") se pinta en UTC para que no retroceda un dia en America; una
 * con hora, en la zona del navegador. Lo que no es fecha devuelve null.
 */
export function formateaFecha(
  valor: string | null | undefined,
  { locale }: Pick<LocaleTenant, "locale"> = LOCALE_POR_DEFECTO,
): string | null {
  const texto = valor?.trim();
  if (!texto) return null;
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(texto);
  const fecha = new Date(soloFecha ? `${texto}T00:00:00Z` : texto);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(soloFecha ? { timeZone: "UTC" } : {}),
  }).format(fecha);
}
