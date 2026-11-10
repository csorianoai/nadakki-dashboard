import { formatearFecha } from "@/lib/analytics/cifra";
import { formatearFechaCorta, type FormatoTenant } from "@/lib/analytics/formato";

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
