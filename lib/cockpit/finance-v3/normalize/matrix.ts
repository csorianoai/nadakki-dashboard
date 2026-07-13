import type { FinanceMatrixResponse } from "../contracts/matrix";
import { parseRegistryWarnings } from "../warnings";

export function normalizeFinanceMatrix(raw: unknown): FinanceMatrixResponse {
  const r = raw as Record<string, unknown>;
  return {
    metric: (r.metric as FinanceMatrixResponse["metric"]) ?? "active_users",
    period: (r.period as FinanceMatrixResponse["period"]) ?? "7d",
    as_of: typeof r.as_of === "string" ? r.as_of : new Date().toISOString(),
    data_source: (r.data_source as FinanceMatrixResponse["data_source"]) ?? "none",
    mrr_attribution_rule: (r.mrr_attribution_rule as FinanceMatrixResponse["mrr_attribution_rule"]) ?? null,
    requires_metering: Boolean(r.requires_metering),
    aggregation_type: (r.aggregation_type as FinanceMatrixResponse["aggregation_type"]) ?? "UNIQUE_COUNT",
    rows: Array.isArray(r.rows) ? (r.rows as FinanceMatrixResponse["rows"]) : [],
    totals_per_column: Array.isArray(r.totals_per_column)
      ? (r.totals_per_column as FinanceMatrixResponse["totals_per_column"])
      : [],
    grand_total: (r.grand_total as FinanceMatrixResponse["grand_total"]) ?? null,
    next_cursor: (r.next_cursor as string | null) ?? null,
    has_more: Boolean(r.has_more),
    total_rows: Number(r.total_rows ?? 0),
    warnings: parseRegistryWarnings(r.warnings),
  };
}
