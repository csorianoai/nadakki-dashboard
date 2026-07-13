import { z } from "zod";
import { cockpitEnvelopeSchema } from "../envelope";

export const matrixMetricSchema = z.enum([
  "active_users",
  "mrr_contribution",
  "activity_7d",
  "core_status",
]);

export const matrixCellSchema = z.object({
  value: z.number().nullable(),
  display: z.string(),
  status: z.enum(["ok", "empty", "disabled", "unknown"]).optional(),
});

export const tenantCoreMatrixDataSchema = z.object({
  metric: matrixMetricSchema,
  period: z.string(),
  cores: z.array(
    z.object({
      core_code: z.string(),
      display_name: z.string(),
      color_hex: z.string().optional(),
    }),
  ),
  tenants: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      tenant_slug: z.string(),
      cells: z.record(z.string(), matrixCellSchema),
      row_total: z.number().nullable().optional(),
    }),
  ),
  column_totals: z.record(z.string(), z.number().nullable()).optional(),
});

export const tenantCoreMatrixEnvelopeSchema = cockpitEnvelopeSchema(tenantCoreMatrixDataSchema);

export type TenantCoreMatrixEnvelope = z.infer<typeof tenantCoreMatrixEnvelopeSchema>;
