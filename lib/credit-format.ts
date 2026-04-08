/**
 * Locale helpers for Credit Dealer UI (DOP display).
 */

/** Dominican Peso — RD$12,500.00 */
export function formatDOP(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return (
    "RD$" +
    new Intl.NumberFormat("es-DO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value))
  );
}

export function formatPercentDecimal(decimal: number | null | undefined): string {
  if (decimal == null || Number.isNaN(Number(decimal))) return "—";
  return `${(Number(decimal) * 100).toFixed(2)}%`;
}

/** Informative monthly payment simulation (standard amortization). */
export function simulateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = annualRate / 12;
  if (r <= 0) return principal / termMonths;
  const pow = (1 + r) ** termMonths;
  return (principal * r * pow) / (pow - 1);
}
