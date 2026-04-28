/** Pure financial helpers — aligned with Forge wizard formulas. */

export function calculatePMT(principal: number, annualRate: number, months: number): number {
  if (months <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/** LTV as percentage 0–100 (e.g. 80 for 80%). */
export function calculateLTV(loanAmount: number, vehicleValue: number): number {
  if (vehicleValue <= 0) return 0;
  return (loanAmount / vehicleValue) * 100;
}

/** DTI as percentage 0–100. */
export function calculateDTI(monthlyDebtPayments: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  return (monthlyDebtPayments / monthlyIncome) * 100;
}

/** Net capacity: income * ratio − debts (spec from refactor prompt). */
export function calculatePaymentCapacity(monthlyIncome: number, currentDebts: number, capacityRatio = 0.4): number {
  return Math.max(0, monthlyIncome * capacityRatio - currentDebts);
}

/**
 * Wizard step “capacidad estimada”: (ingreso + otros − deudas) × ratio.
 * Preserves previous WizardContainer behavior.
 */
export function calculateWizardEstimatedCapacity(
  monthlyIncome: number,
  otherMonthlyIncome: number,
  monthlyDebts: number,
  ratio = 0.4
): number {
  return Math.max(0, (monthlyIncome + otherMonthlyIncome - monthlyDebts) * ratio);
}

/** Previsualización revisión: ingreso total × ratio (sin restar deudas). */
export function calculateIncomeCapacityPreview(totalMonthlyIncome: number, ratio = 0.35): number {
  return totalMonthlyIncome * ratio;
}

export function calculateAmountToFinance(salesPrice: number, downPayment: number): number {
  return Math.max(0, salesPrice - downPayment);
}
