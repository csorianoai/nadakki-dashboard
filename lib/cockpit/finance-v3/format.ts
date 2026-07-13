import { isFinancialValueKnown } from "@/lib/cockpit/finance-v3/data-source";
import type { CockpitDataSource } from "@/lib/cockpit/finance-v3/envelope";

export function formatCockpitMoney(
  value: number | null | undefined,
  locale: string,
  currency: string,
  dataSource: CockpitDataSource,
): string {
  if (!isFinancialValueKnown(dataSource, value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function formatCockpitInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-DO").format(value);
}
