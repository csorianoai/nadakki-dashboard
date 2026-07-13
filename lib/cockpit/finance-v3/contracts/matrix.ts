import { z } from "zod";
import { cockpitStructuredWarningSchema } from "../warnings";

export const matrixMetricSchema = z.enum([
  "active_users",
  "mrr",
  "activity_7d",
  "core_status",
  "estimated_cost",
  "margin",
]);

export const matrixPeriodSchema = z.enum(["7d", "30d", "current"]);

export const matrixAggregationSchema = z.enum([
  "SUM",
  "UNIQUE_COUNT",
  "NON_ADDITIVE",
  "WEIGHTED",
  "NOT_APPLICABLE",
]);

export const matrixCellSchema = z.object({
  core_code: z.string(),
  value: z.number().nullable(),
  display_value: z.string(),
  data_source: z.enum(["live", "derived", "partial", "demo", "none", "stale", "error"]),
});

export const matrixTotalSchema = z.object({
  value: z.number().nullable(),
  display_value: z.string(),
});

export const matrixRowSchema = z.object({
  tenant_id: z.string().uuid(),
  tenant_slug: z.string(),
  tenant_name: z.string(),
  plan_code: z.string(),
  country: z.string(),
  cells: z.array(matrixCellSchema),
  row_total: matrixTotalSchema.nullable().optional(),
});

export const matrixColumnTotalSchema = z.object({
  core_code: z.string(),
  value: z.number().nullable(),
  display_value: z.string(),
});

/** Unified matrix response — flat shape from backend (not nested in envelope.data). */
export const financeMatrixResponseSchema = z.object({
  metric: matrixMetricSchema,
  period: matrixPeriodSchema,
  as_of: z.string(),
  data_source: z.enum(["live", "derived", "partial", "demo", "none", "stale", "error"]),
  mrr_attribution_rule: z.enum(["attributable", "net"]).nullable().optional(),
  requires_metering: z.boolean(),
  aggregation_type: matrixAggregationSchema,
  rows: z.array(matrixRowSchema),
  totals_per_column: z.array(matrixColumnTotalSchema),
  grand_total: matrixTotalSchema.nullable().optional(),
  next_cursor: z.string().nullable().optional(),
  has_more: z.boolean(),
  total_rows: z.number().int().nonnegative(),
  warnings: z.array(cockpitStructuredWarningSchema).optional(),
});

export type MatrixMetric = z.infer<typeof matrixMetricSchema>;
export type MatrixPeriod = z.infer<typeof matrixPeriodSchema>;
export type MatrixCell = z.infer<typeof matrixCellSchema>;
export type MatrixRow = z.infer<typeof matrixRowSchema>;
export type FinanceMatrixResponse = z.infer<typeof financeMatrixResponseSchema>;
