/** MEE formatters — currency-dynamic (ported from design-system/mee/mee-ui.jsx). */

export function fmtLocal(
  n: number | null | undefined,
  cur?: string | null,
  locale?: string | null,
): string {
  if (n == null || !cur) return "—";
  const abs = Math.abs(n);
  const numberLocale = locale || undefined;
  if (abs >= 1e9) {
    return `${cur}${(n / 1e9).toLocaleString(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}MM`;
  }
  if (abs >= 1e6) {
    return `${cur}${(n / 1e6).toLocaleString(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1e3) {
    return `${cur}${(n / 1e3).toLocaleString(numberLocale, { maximumFractionDigits: 0 })}K`;
  }
  return `${cur}${n.toLocaleString(numberLocale)}`;
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) {
    return `US$${(n / 1e9).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}MM`;
  }
  if (abs >= 1e6) {
    return `US$${(n / 1e6).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1e3) {
    return `US$${(n / 1e3).toLocaleString("en-US", { maximumFractionDigits: 0 })}K`;
  }
  return `US$${n.toLocaleString("en-US")}`;
}

export function fmtPlain(n: number | null | undefined, locale?: string | null): string {
  return n == null ? "—" : n.toLocaleString(locale || undefined);
}

export function fmtMoneyExact(
  n: number | null | undefined,
  cur?: string | null,
  locale?: string | null,
): string {
  if (n == null || !cur) return "—";
  return `${cur}${n.toLocaleString(locale || undefined)}`;
}

export interface DataPoint {
  metric: string;
  value: number;
  unit: string;
  year?: number;
}

export function fmtDataPoint(
  dp: DataPoint,
  cur?: string | null,
  locale?: string | null,
): string {
  const v = dp.value;
  switch (dp.unit) {
    case "DOP":
      return fmtLocal(v, cur, locale);
    case "pct":
      return `${v}%`;
    case "x":
      return `${v}×`;
    case "days":
      return `${v} días`;
    case "units":
      return fmtPlain(v, locale);
    case "flag":
      return v ? "Sí" : "No";
    default:
      return fmtPlain(v, locale);
  }
}
