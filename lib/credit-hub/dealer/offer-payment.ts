import type { CreditOffer } from "@/lib/credit-hub/types/offers";

/** Cuota mensual por amortización francesa. La APR llega como 17 o como 0.17. */
export function amortizedMonthlyPayment(amount: number, apr: number, months: number): number | null {
  if (!(amount > 0) || !(months > 0) || !(apr >= 0)) return null;
  const r = (apr < 1 ? apr : apr / 100) / 12;
  if (r === 0) return amount / months;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
}

/**
 * Cuota a mostrar. Una cuota informada MENOR que la amortización pura de monto, tasa y plazo no es
 * posible (los cargos solo la suben): se muestra la calculada y se avisa (ronda 3 de Cowork, DB-CODEX-16).
 */
export function displayMonthlyPayment(offer: Pick<CreditOffer, "amount_approved" | "interest_rate_apr" | "term_months" | "monthly_payment">): {
  value: number | null;
  reported: number | null;
  mismatch: boolean;
} {
  const reported = offer.monthly_payment ?? null;
  const computed =
    offer.amount_approved != null && offer.interest_rate_apr != null && offer.term_months != null
      ? amortizedMonthlyPayment(Number(offer.amount_approved), offer.interest_rate_apr, offer.term_months)
      : null;
  if (computed != null && reported != null && reported < computed * 0.99) {
    return { value: computed, reported, mismatch: true };
  }
  return { value: reported ?? null, reported, mismatch: false };
}
