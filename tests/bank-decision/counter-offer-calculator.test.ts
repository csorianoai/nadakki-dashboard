import {
  computeCounterPti,
  estimateMonthlyLoanPayment,
  financedPrincipal,
} from "@/lib/bank-decision/counter-offer-calculator";

describe("counter-offer-calculator", () => {
  test("estimateMonthlyLoanPayment zeros for bad inputs", () => {
    expect(estimateMonthlyLoanPayment(0, 10, 12)).toBe(0);
    expect(estimateMonthlyLoanPayment(10000, 10, 0)).toBe(0);
  });

  test("estimateMonthlyLoanPayment reduces to principal/term at 0%", () => {
    expect(estimateMonthlyLoanPayment(120000, 0, 12)).toBeCloseTo(10000, 6);
  });

  test("financedPrincipal applies down payment pct", () => {
    expect(financedPrincipal(100000, 10)).toBe(90000);
    expect(financedPrincipal(100000, 0)).toBe(100000);
    expect(financedPrincipal(100000, 100)).toBe(0);
    expect(financedPrincipal(-1, 0)).toBe(0);
    expect(financedPrincipal(NaN, 0)).toBe(0);
  });

  test("computeCounterPti null without income", () => {
    expect(
      computeCounterPti({
        grossMonthlyIncome: 0,
        counterAmount: 100000,
        annualInterestPct: 18,
        termMonths: 60,
        downPaymentPct: 0,
      }),
    ).toBeNull();
  });

  test("computeCounterPti returns positive percent typical case", () => {
    const pti = computeCounterPti({
      grossMonthlyIncome: 75000,
      counterAmount: 300000,
      annualInterestPct: 14,
      termMonths: 48,
      downPaymentPct: 10,
    });
    expect(pti).not.toBeNull();
    expect(pti!).toBeGreaterThan(0);
    expect(pti!).toBeLessThan(100);
  });

  test("higher rate increases PTI for same financing", () => {
    const base = computeCounterPti({
      grossMonthlyIncome: 100000,
      counterAmount: 500000,
      annualInterestPct: 10,
      termMonths: 60,
      downPaymentPct: 5,
    });
    const hi = computeCounterPti({
      grossMonthlyIncome: 100000,
      counterAmount: 500000,
      annualInterestPct: 22,
      termMonths: 60,
      downPaymentPct: 5,
    });
    expect(hi!).toBeGreaterThan(base!);
  });

  test("computeCounterPti null when financing invalid amounts", () => {
    expect(
      computeCounterPti({
        grossMonthlyIncome: 75000,
        counterAmount: 0,
        annualInterestPct: 12,
        termMonths: 60,
        downPaymentPct: 0,
      }),
    ).toBeNull();
  });

  test("estimateMonthlyLoanPayment is finite mid-range APR", () => {
    const p = estimateMonthlyLoanPayment(250000, 16.5, 48);
    expect(p > 6800 && p < 9000).toBe(true);
  });
});
