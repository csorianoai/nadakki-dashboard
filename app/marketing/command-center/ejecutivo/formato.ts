import { formatearFecha } from "@/lib/analytics/cifra";

/** "2026-11-09T14:00:00Z" -> "9 nov 2026, 14:00 UTC". Determinista (UTC). Fecha invalida => null. */
export function formatearInstante(iso: string | null | undefined): string | null {
  const dia = formatearFecha(iso);
  if (dia === null || !iso) return null;
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dia}, ${hh}:${mm} UTC`;
}

/** "2026-11-07" -> "7 nov" (sin ano, para rangos cortos). */
export function formatearDiaCorto(iso: string): string {
  const completo = formatearFecha(iso);
  return completo ? completo.replace(/ \d{4}$/, "") : iso;
}
