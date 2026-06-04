/**
 * Safe relative-time formatting (P1-C / Cowork audit).
 * Guards null, epoch, NaN, and pre-2000 dates to avoid "hace 20,608 días".
 */

const EPOCH_ISO = "1970-01-01T00:00:00Z";

export function isValidDateInput(
  value: string | number | Date | null | undefined
): value is string | number | Date {
  if (value == null || value === "" || value === 0 || value === "0") return false;
  if (value === EPOCH_ISO || value === "1970-01-01") return false;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) return false;
  return true;
}

/** React Query `dataUpdatedAt` (ms) — "Última sync" labels. */
export function formatSyncAgeMs(
  dataUpdatedAt: number | undefined | null,
  locale: string,
  options: { fallback?: string; neverSyncedLabel?: string } = {}
): string {
  const { fallback = "\u2014", neverSyncedLabel = "Nunca" } = options;
  if (dataUpdatedAt == null || Number.isNaN(dataUpdatedAt) || dataUpdatedAt <= 0) {
    return neverSyncedLabel;
  }
  const date = new Date(dataUpdatedAt);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return neverSyncedLabel;
  }

  const sec = Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 1000));
  const loc = locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  if (sec < 45) return rtf.format(-sec, "second");
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 72) return rtf.format(-hr, "hour");
  const day = Math.floor(hr / 24);
  if (day > 30) return fallback;
  return rtf.format(-day, "day");
}

export function formatTimeAgo(
  dateString: string | number | Date | null | undefined,
  options: { fallback?: string; locale?: string } = {}
): string {
  const { fallback = "\u2014", locale = "es-DO" } = options;
  if (!isValidDateInput(dateString)) return fallback;

  const date = dateString instanceof Date ? dateString : new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return fallback;

  if (seconds < 60) return "hace un momento";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} d`;

  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}
