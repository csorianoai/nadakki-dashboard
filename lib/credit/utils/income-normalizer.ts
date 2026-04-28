export type IncomeFrequency = "MENSUAL" | "QUINCENAL" | "SEMANAL" | "TRIMESTRAL" | "ANUAL" | "VARIABLE";

/** @deprecated Use `IncomeFrequency` */
export type Frequency = IncomeFrequency;

export interface OtherIncomeSource {
  amount: number;
  frequency: IncomeFrequency;
  variable_avg_6_months?: number;
}

export function normalizeToMonthly(
  amount: number,
  frequency: IncomeFrequency,
  variableAvg6Months?: number
): number {
  if (frequency === "VARIABLE") return variableAvg6Months ?? 0;
  const multipliers: Record<IncomeFrequency, number> = {
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
  otherIncomes: OtherIncomeSource[] | null | undefined
): number {
  if (!otherIncomes || otherIncomes.length === 0) return baseSalary;
  const otherTotal = otherIncomes.reduce(
    (sum, inc) => sum + normalizeToMonthly(inc.amount, inc.frequency, inc.variable_avg_6_months),
    0
  );
  return baseSalary + otherTotal;
}
