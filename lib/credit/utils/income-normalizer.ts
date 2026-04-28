export type Frequency = "MENSUAL" | "QUINCENAL" | "SEMANAL" | "TRIMESTRAL" | "ANUAL" | "VARIABLE";

export function normalizeToMonthly(amount: number, frequency: Frequency, variableAvg6Months?: number): number {
  if (frequency === "VARIABLE") return variableAvg6Months ?? 0;
  const multipliers: Record<Frequency, number> = {
    MENSUAL: 1,
    QUINCENAL: 2,
    SEMANAL: 4.33,
    TRIMESTRAL: 1 / 3,
    ANUAL: 1 / 12,
    VARIABLE: 0,
  };
  return amount * multipliers[frequency];
}

export function calculateTotalMonthlyIncome(
  baseSalary: number,
  otherIncomes: Array<{ amount: number; frequency: Frequency; variableAvg?: number }>
): number {
  if (!otherIncomes || otherIncomes.length === 0) return baseSalary;
  const otherTotal = otherIncomes.reduce(
    (sum, inc) => sum + normalizeToMonthly(inc.amount, inc.frequency, inc.variableAvg),
    0
  );
  return baseSalary + otherTotal;
}
