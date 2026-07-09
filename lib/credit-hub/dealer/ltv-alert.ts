import { calculateLTV } from "@/lib/credit/utils/financial-calculator";

export type LtvAlertLevel = "none" | "warning" | "danger";

export function ltvAlertLevel(ltvPercent: number): LtvAlertLevel {
  if (ltvPercent >= 90) return "danger";
  if (ltvPercent >= 80) return "warning";
  return "none";
}

export function computeLtvFromForm(vehiclePrice: number, downPayment: number): number {
  const loan = Math.max(0, vehiclePrice - downPayment);
  return calculateLTV(loan, vehiclePrice);
}

export function ltvAlertCopy(level: LtvAlertLevel, ltvPercent: number): string | null {
  if (level === "danger") return `LTV ${ltvPercent.toFixed(0)}% — ratio muy alto (≥90%). El banco validará el monto.`;
  if (level === "warning") return `LTV ${ltvPercent.toFixed(0)}% — ratio elevado (≥80%). Considera aumentar el enganche.`;
  return null;
}
