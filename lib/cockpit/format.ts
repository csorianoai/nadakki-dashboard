/** Locale-aware cockpit number formatting (default es-DO / DOP). */

export function formatCurrency(
  value: number,
  locale = "es-DO",
  currency = "DOP",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, locale = "es-DO", digits = 1): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

export function formatInteger(value: number, locale = "es-DO"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

export function longDateEsDO(date = new Date()): string {
  return date.toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
