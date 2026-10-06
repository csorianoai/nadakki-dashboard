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

type ParteFecha = "day" | "month" | "year";

/** Orden de dia, mes y año que usa el locale ("es-AR": dia, mes, año). */
function ordenFecha(locale: string): ParteFecha[] {
  const partes = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(Date.UTC(2026, 9, 5)));
  const orden = partes
    .map((parte) => parte.type)
    .filter((tipo): tipo is ParteFecha => tipo === "day" || tipo === "month" || tipo === "year");
  return orden.length === 3 ? orden : ["day", "month", "year"];
}

const PATRON_PARTE: Record<ParteFecha, string> = { day: "dd", month: "mm", year: "aaaa" };

/** Lo que se le pide escribir al dealer: "dd/mm/aaaa" en es-AR, "mm/dd/aaaa" en en-US. */
export function patronFecha({ locale }: Pick<LocaleTenant, "locale"> = LOCALE_POR_DEFECTO): string {
  return ordenFecha(locale).map((parte) => PATRON_PARTE[parte]).join("/");
}

/**
 * Lo inverso de `formateaFecha`: el texto que escribe el dealer, en el orden
 * de su locale, a ISO "aaaa-mm-dd". Tambien acepta ISO tal cual. Una fecha que
 * no existe (31/02/2026) o un texto vacio devuelve null: no se corrige sola.
 */
export function parseaFecha(
  texto: string | null | undefined,
  { locale }: Pick<LocaleTenant, "locale"> = LOCALE_POR_DEFECTO,
): string | null {
  const limpio = texto?.trim();
  if (!limpio) return null;
  let partes: Record<ParteFecha, string>;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpio);
  if (iso) {
    partes = { year: iso[1], month: iso[2], day: iso[3] };
  } else {
    const trozos = /^(\d{1,4})[/.-](\d{1,4})[/.-](\d{1,4})$/.exec(limpio);
    if (!trozos) return null;
    const [a, b, c] = ordenFecha(locale);
    partes = { [a]: trozos[1], [b]: trozos[2], [c]: trozos[3] } as Record<ParteFecha, string>;
    if (partes.year.length !== 4 || partes.month.length > 2 || partes.day.length > 2) return null;
  }
  const [anio, mes, dia] = [Number(partes.year), Number(partes.month), Number(partes.day)];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const existe =
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  if (!existe) return null;
  return `${partes.year}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
