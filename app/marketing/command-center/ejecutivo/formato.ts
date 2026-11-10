import { formatearFecha, type PeriodoAnalitica } from "@/lib/analytics/cifra";
import { formatearFechaCorta, type FormatoTenant } from "@/lib/analytics/formato";
import { OPCIONES_PERIODO } from "@/lib/analytics/periodo";

/** "30d" -> "30 días"; personalizado con rango -> "7 nov – 9 nov"; personalizado sin rango -> "Personalizado". Nunca lanza. */
export function etiquetaPeriodo(periodo: PeriodoAnalitica, formato?: FormatoTenant): string {
  if (periodo.tipo === "personalizado") {
    return periodo.desde && periodo.hasta ? `${formatearFechaCorta(periodo.desde, formato)} – ${formatearFechaCorta(periodo.hasta, formato)}` : "Personalizado";
  }
  return OPCIONES_PERIODO.find((o) => o.tipo === periodo.tipo)?.etiqueta ?? periodo.tipo;
}

/** "2026-11-09T14:00:00Z" -> "9 nov 2026, 14:00 UTC" (en el locale del tenant). Determinista (UTC). Fecha invalida => null. */
export function formatearInstante(iso: string | null | undefined, formato?: FormatoTenant): string | null {
  const dia = formatearFecha(iso, formato);
  if (dia === null || !iso) return null;
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dia}, ${hh}:${mm} UTC`;
}

/** "2026-11-07" -> "7 nov" (sin año, para rangos cortos), en el locale del tenant. */
export function formatearDiaCorto(iso: string, formato?: FormatoTenant): string {
  return formatearFechaCorta(iso, formato);
}
