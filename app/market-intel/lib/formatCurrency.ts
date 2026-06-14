/** Format amounts for MEE pricing / market overview (USD, DOP, COP). */
export function formatMarketIntelCurrency(amount: number, currency = "USD"): string {
  const formatted = amount.toLocaleString("es-DO", { maximumFractionDigits: 2 });
  if (currency === "COP") return `COL$ ${formatted}`;
  if (currency === "USD") return `US$ ${formatted}`;
  if (currency === "DOP") return `RD$ ${formatted}`;
  return `${currency} ${formatted}`;
}

export function formatGrowthRatePct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("es-DO", { maximumFractionDigits: 1 })}%`;
}
