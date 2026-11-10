/**
 * Formato por tenant del kit de analitica: locale (BCP 47) y moneda (ISO 4217) salen de la configuracion de cada tenant.
 * NADA fijo en el kit: este es el unico archivo del kit donde pueden aparecer un locale o una moneda como literal
 * (el valor por defecto es-US / USD); un test lo vigila.
 *
 * Fuente del dato en el dashboard (medido): TenantBranding (lib/credit-hub/types/tenantBranding.ts) trae `locale`
 * ("es-DO", "en-US") y `currency` ("DOP", "USD"); se lee con useTenantBranding() (lib/hooks/useTenantBranding.ts).
 * TenantContext.settings trae `language` ("es", sin region) y `currency`. Si el tenant no trae locale o moneda validos,
 * se usa es-US / USD sin lanzar.
 */

export interface FormatoTenant {
  /** Etiqueta BCP 47, p. ej. "es-US", "en-US", "es-AR". */
  locale: string;
  /** Codigo ISO 4217 en mayusculas, p. ej. "USD", "ARS". */
  moneda: string;
}

export const FORMATO_POR_DEFECTO: Readonly<FormatoTenant> = Object.freeze({ locale: "es-US", moneda: "USD" });

/** Locale canonico si es valido y el entorno lo soporta; null si no. Nunca lanza. */
function localeValido(x: unknown): string | null {
  if (typeof x !== "string" || !x.trim()) return null;
  try {
    const [canon] = Intl.getCanonicalLocales(x.trim().replace(/_/g, "-"));
    if (!canon) return null;
    return Intl.NumberFormat.supportedLocalesOf([canon]).length > 0 ? canon : null;
  } catch {
    return null;
  }
}

/** Moneda ISO 4217 en mayusculas si el entorno la reconoce; null si no. Nunca lanza. */
function monedaValida(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const m = x.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(m)) return null;
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: m }).format(1);
    return m;
  } catch {
    return null;
  }
}

const normalizados = new Map<string, FormatoTenant>();

/** Completa y valida un formato parcial: lo invalido o ausente cae al valor por defecto. Con cache: se llama por cada celda. */
export function normalizarFormato(parcial?: { locale?: unknown; moneda?: unknown } | null): FormatoTenant {
  const clave = `${typeof parcial?.locale === "string" ? parcial.locale : ""}|${typeof parcial?.moneda === "string" ? parcial.moneda : ""}`;
  let v = normalizados.get(clave);
  if (!v) {
    v = Object.freeze({
      locale: localeValido(parcial?.locale) ?? FORMATO_POR_DEFECTO.locale,
      moneda: monedaValida(parcial?.moneda) ?? FORMATO_POR_DEFECTO.moneda,
    });
    if (normalizados.size > 200) normalizados.clear();
    normalizados.set(clave, v);
  }
  return v;
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

/**
 * Adaptador tipado desde la configuracion del tenant. Acepta la forma de TenantBranding ({ locale, currency }), la de
 * TenantContext.settings ({ language, currency }; `language` solo vale si trae region, p. ej. "es-AR"; "es" a secas es ambiguo
 * y se ignora) y el propio FormatoTenant ({ locale, moneda }). Cualquier otra cosa devuelve el formato por defecto.
 */
export function formatoDesdeTenant(config: unknown): FormatoTenant {
  if (!esObjeto(config)) return { ...FORMATO_POR_DEFECTO };
  const anidado = esObjeto(config.settings) ? config.settings : esObjeto(config.branding) ? config.branding : null;
  const leer = (clave: string): unknown => (config[clave] !== undefined ? config[clave] : anidado?.[clave]);
  const idioma = leer("language");
  const conRegion = typeof idioma === "string" && /[-_][A-Za-z]{2,}/.test(idioma) ? idioma : undefined;
  return normalizarFormato({ locale: leer("locale") ?? conRegion, moneda: leer("currency") ?? leer("moneda") });
}

// --- Intl con cache (crear un Intl.* por celda es caro) ---------------------------------------------------------------------
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.Collator>();
function memo<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.Collator>(clave: string, crear: () => T): T {
  let v = cache.get(clave) as T | undefined;
  if (!v) {
    v = crear();
    cache.set(clave, v);
  }
  return v;
}

/** Numero con separadores del locale del tenant. */
export function formatearNumero(n: number, f: FormatoTenant = FORMATO_POR_DEFECTO, maxDecimales = 2): string {
  const fmt = normalizarFormato(f);
  return memo(`n|${fmt.locale}|${maxDecimales}`, () => new Intl.NumberFormat(fmt.locale, { maximumFractionDigits: maxDecimales })).format(n);
}

/** Moneda del tenant (o la propia de la cifra, si la trae). Siempre con 2 decimales. */
export function formatearMoneda(n: number, f: FormatoTenant = FORMATO_POR_DEFECTO, moneda?: string): string {
  const fmt = normalizarFormato(f);
  const cod = monedaValida(moneda) ?? fmt.moneda;
  return memo(
    `m|${fmt.locale}|${cod}`,
    () => new Intl.NumberFormat(fmt.locale, { style: "currency", currency: cod, minimumFractionDigits: 2, maximumFractionDigits: 2 })
  ).format(n);
}

/** `n` esta en puntos porcentuales (1,5 = 1,5 %). La forma ("1.5%", "1,5 %") la decide el locale. */
export function formatearPorcentaje(n: number, f: FormatoTenant = FORMATO_POR_DEFECTO, decimales = 1): string {
  const fmt = normalizarFormato(f);
  return memo(
    `p|${fmt.locale}|${decimales}`,
    () => new Intl.NumberFormat(fmt.locale, { style: "percent", minimumFractionDigits: decimales, maximumFractionDigits: decimales })
  ).format(n / 100);
}

/** Dias con la unidad "d". */
export function formatearDias(n: number, f: FormatoTenant = FORMATO_POR_DEFECTO): string {
  return `${formatearNumero(n, f, 1)} d`;
}

function aFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  // Solo ISO 8601 (YYYY-MM-DD o con hora): new Date("Semana 3") "funciona" en V8 y convertiria etiquetas de eje en fechas falsas.
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(iso)) return null;
  // Sin hora o sin zona se interpreta como UTC, igual que el formateo (timeZone: "UTC"): ningun dia se corre por la zona del equipo.
  const base = iso.replace(" ", "T");
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(base) ? `${base}T00:00:00Z` : /(?:Z|[+-]\d{2}:?\d{2})$/.test(base) ? base : `${base}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-11-10" -> "10 nov 2026" (es-US) / "Nov 10, 2026" (en-US). En UTC: no depende de la zona horaria del equipo. null si no es fecha. */
export function formatearFecha(iso: string | null | undefined, f: FormatoTenant = FORMATO_POR_DEFECTO): string | null {
  const d = aFecha(iso);
  if (!d) return null;
  const fmt = normalizarFormato(f);
  return memo(`d|${fmt.locale}`, () => new Intl.DateTimeFormat(fmt.locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })).format(d);
}

/** Dia y mes, para ejes y rotulos. Si no es fecha devuelve el texto tal cual. */
export function formatearFechaCorta(x: string, f: FormatoTenant = FORMATO_POR_DEFECTO): string {
  const d = aFecha(x);
  if (!d) return x;
  const fmt = normalizarFormato(f);
  return memo(`c|${fmt.locale}`, () => new Intl.DateTimeFormat(fmt.locale, { day: "numeric", month: "short", timeZone: "UTC" })).format(d);
}

/** Comparador de texto del locale del tenant (orden de tablas). */
export function comparadorTexto(f: FormatoTenant = FORMATO_POR_DEFECTO): Intl.Collator {
  const fmt = normalizarFormato(f);
  return memo(`k|${fmt.locale}`, () => new Intl.Collator(fmt.locale, { sensitivity: "base", numeric: true }));
}
