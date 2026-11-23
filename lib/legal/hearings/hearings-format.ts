/**
 * Display helpers for hearings. Pure functions (no side effects) so they are
 * trivially testable and safe to use in server/client components.
 */
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

/**
 * Format an ISO TIMESTAMPTZ for display in the hearing's own timezone.
 * Falls back gracefully on invalid input instead of throwing.
 */
export function formatHearingDate(iso: string, timezone?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("es-DO", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone || undefined,
    }).format(d);
  } catch {
    // Invalid timezone string → fall back to default locale formatting.
    return new Intl.DateTimeFormat("es-DO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }
}

/** Calendar grouping key (YYYY-MM-DD) in the hearing's timezone. */
export function hearingDayKey(iso: string, timezone?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    // en-CA yields ISO-like YYYY-MM-DD which sorts lexicographically.
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone || undefined,
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Human label for a day group (e.g. "lunes, 30 jun 2026"). */
export function formatDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Hora de reloj del tribunal → instante ISO (QA 23-nov-2026).
 * El campo datetime-local se interpretaba en la zona del NAVEGADOR y luego se
 * mostraba en la del tribunal: un abogado en Miami (UTC-5) que escribía 9:30
 * veía 10:30 en Santo Domingo (UTC-4). Ahora 9:30 es 9:30 en la zona del tribunal.
 */
export function horaDelTribunalAIso(valor: string, timezone: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(valor);
  if (!m) return new Date(valor).toISOString();
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[];
  const comoUtc = Date.UTC(y, mo - 1, d, h, mi);
  const desfase = (instante: number): number => {
    try {
      const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      }).formatToParts(new Date(instante));
      const v = (t: string) => Number(partes.find((p) => p.type === t)?.value);
      return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute")) - instante;
    } catch {
      return -new Date(instante).getTimezoneOffset() * 60_000;
    }
  };
  // Dos pasadas por si el cambio de horario cae entre medio.
  let instante = comoUtc - desfase(comoUtc);
  instante = comoUtc - desfase(instante);
  return new Date(instante).toISOString();
}

const ETIQUETAS: Record<string, string> = {
  SCHEDULED: "Programada", CONFIRMED: "Confirmada", IN_PROGRESS: "En curso", COMPLETED: "Celebrada",
  POSTPONED: "Aplazada", CANCELLED: "Cancelada", NO_SHOW: "No comparecencia",
  AUDIENCIA_FONDO: "Audiencia de fondo", AUDIENCIA_PRELIMINAR: "Audiencia preliminar",
  AUDIENCIA_MEDIDAS_CAUTELARES: "Audiencia de medidas cautelares", AUDIENCIA_CONCILIACION: "Audiencia de conciliación",
  LECTURA_SENTENCIA: "Lectura de sentencia", DEPOSITO_DOCUMENTOS: "Depósito de documentos", VISTA_CAUSA: "Vista de la causa",
  AUDIENCIA_PRIMERA_CALIFICACION: "Audiencia de primera calificación", AUDIENCIA_JUICIO_ORAL: "Juicio oral",
  AUDIENCIA_MEDIDA_COERCION: "Audiencia de medida de coerción", AUDIENCIA_LABORAL_CONCILIACION: "Audiencia laboral de conciliación",
  AUDIENCIA_LABORAL_PRODUCCION_PRUEBAS: "Audiencia laboral de producción de pruebas", AUDIENCIA_LABORAL_FONDO: "Audiencia laboral de fondo",
  OTRO: "Otro",
};

/** Turn an enum-ish token (AUDIENCIA_FONDO) into a readable label. */
export function humanizeToken(token: string): string {
  if (!token) return "—";
  if (ETIQUETAS[token.toUpperCase()]) return ETIQUETAS[token.toUpperCase()];
  return token
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Group hearings by day key, sorted ascending by day then by time. */
export function groupHearingsByDay(
  hearings: ReadonlyArray<HearingOut>,
): Array<{ dayKey: string; items: HearingOut[] }> {
  const map = new Map<string, HearingOut[]>();
  for (const h of hearings) {
    const key = hearingDayKey(h.hearing_date, h.timezone);
    const bucket = map.get(key);
    if (bucket) bucket.push(h);
    else map.set(key, [h]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, items]) => ({
      dayKey,
      items: items.slice().sort((a, b) => a.hearing_date.localeCompare(b.hearing_date)),
    }));
}
