export interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export function calculateAmortization(principal: number, annualRate: number, months: number): AmortizationRow[] {
  if (months <= 0 || principal <= 0) return [];

  const monthlyRate = annualRate / 12 / 100;
  const payment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  const rows: AmortizationRow[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let m = 1; m <= months; m++) {
    const interestPaid = balance * monthlyRate;
    const principalPaid = payment - interestPaid;
    balance = Math.max(0, balance - principalPaid);
    cumulativeInterest += interestPaid;
    cumulativePrincipal += principalPaid;

    rows.push({
      month: m,
      payment,
      principalPaid,
      interestPaid,
      balance,
      cumulativeInterest,
      cumulativePrincipal,
    });
  }

  return rows;
}
