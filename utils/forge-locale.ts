/**
 * Locale helpers for Forge UI (MoneyInput, DateInput).
 * No tenant strings — callers pass `locale` and `currency` from tenant config (Phase 8).
 */
export function formatForgeCurrency(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function formatForgeDate(isoDate: string, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: "medium" }).format(d);
}
