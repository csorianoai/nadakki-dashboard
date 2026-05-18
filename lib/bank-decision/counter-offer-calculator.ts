/** Amortizing loan monthly payment (standard PMT). */
export function estimateMonthlyLoanPayment(
  principal: number,
  annualAprPercent: number,
  termMonths: number,
): number {
  if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(termMonths) || termMonths <= 0) return 0;
  const r = annualAprPercent / 100 / 12;
  if (r <= 0) return principal / termMonths;
  const pow = Math.pow(1 + r, termMonths);
  const payment = (principal * r * pow) / (pow - 1);
  return Number.isFinite(payment) ? payment : 0;
}

export function financedPrincipal(requestedAmount: number, downPaymentPct: number): number {
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) return 0;
  const d = Math.min(100, Math.max(0, Number.isFinite(downPaymentPct) ? downPaymentPct : 0));
  return requestedAmount * (1 - d / 100);
}

/** PTI (%): installment / gross monthly income * 100 (SPEC-005 real-time indicator). */
export function computeCounterPti(args: {
  grossMonthlyIncome: number;
  counterAmount: number;
  annualInterestPct: number;
  termMonths: number;
  downPaymentPct: number;
}): number | null {
  if (!Number.isFinite(args.grossMonthlyIncome) || args.grossMonthlyIncome <= 0) return null;
  const pv = financedPrincipal(args.counterAmount, args.downPaymentPct);
  if (!(pv > 0)) return null;
  const pmt = estimateMonthlyLoanPayment(pv, args.annualInterestPct, args.termMonths);
  return (pmt / args.grossMonthlyIncome) * 100;
}
