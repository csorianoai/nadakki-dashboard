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

/** Turn an enum-ish token (AUDIENCIA_FONDO) into a readable label. */
export function humanizeToken(token: string): string {
  if (!token) return "—";
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
