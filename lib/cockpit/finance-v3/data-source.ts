import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import type { CockpitDataSource } from "./envelope";

/** Maps v3.1 cockpit data_source → DataTruthBadge level (see CONTRACTS.md). */
export const COCKPIT_DATA_SOURCE_TO_BADGE: Record<CockpitDataSource, DataTruthLevel> = {
  live: "REAL",
  derived: "DERIVED",
  estimated: "ESTIMATED",
  demo: "DEMO",
  none: "NONE",
};

export function cockpitDataSourceToBadgeLevel(source: CockpitDataSource): DataTruthLevel {
  return COCKPIT_DATA_SOURCE_TO_BADGE[source];
}

/** Financial panels: `none` must not be coerced to zero. */
export function isFinancialValueKnown(
  source: CockpitDataSource,
  value: number | null | undefined,
): boolean {
  if (source === "none") return false;
  return value !== null && value !== undefined;
}
