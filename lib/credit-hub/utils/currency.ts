/** Dominican Republic defaults for Credit Hub money display. */
export const CH_DEFAULT_LOCALE = "es-DO";
export const CH_DEFAULT_CURRENCY_CODE = "DOP";
export const CH_DEFAULT_CURRENCY_SYMBOL = "RD$";

const CURRENCY_SYMBOLS: Record<string, string> = {
  DOP: CH_DEFAULT_CURRENCY_SYMBOL,
  USD: "$",
  MXN: "MX$",
  BOB: "Bs",
  COP: "COL$",
  PEN: "S/",
};

export function currencySymbolFromCode(code?: string | null): string {
  const key = (code ?? CH_DEFAULT_CURRENCY_CODE).toUpperCase();
  return CURRENCY_SYMBOLS[key] ?? `${key} `;
}

/** Compact numeric part without symbol (e.g. 980K) for split KPI cards. */
export function formatCompactMoneySuffix(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) {
    return `${(n / 1e6).toLocaleString(CH_DEFAULT_LOCALE, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}M`;
  }
  if (a >= 1e3) {
    return `${(n / 1e3).toLocaleString(CH_DEFAULT_LOCALE, { maximumFractionDigits: 0 })}K`;
  }
  return n.toLocaleString(CH_DEFAULT_LOCALE);
}
