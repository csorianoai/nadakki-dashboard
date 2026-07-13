import { z } from "zod";
import { cockpitCurrencySchema, cockpitEnvelopeSchema } from "../envelope";

/** Target contract for GET /api/v1/cockpit/finance/kpis (F3 backend). */
export const financeKpisDataSchema = z.object({
  total_mrr: z.number().nonnegative(),
  arr_projected: z.number().nonnegative(),
  active_subscriptions: z.number().int().nonnegative(),
  tenants_managed: z.number().int().nonnegative(),
  tenants_unmanaged: z.number().int().nonnegative(),
});

export const mrrByCoreItemSchema = z.object({
  core_code: z.string(),
  display_name: z.string(),
  mrr: z.number().nonnegative(),
  tenant_count: z.number().int().nonnegative(),
  color_hex: z.string().optional(),
});

export const mrrByCoreDataSchema = z.object({
  cores: z.array(mrrByCoreItemSchema),
});

export const tenantFinancialRowSchema = z.object({
  tenant_id: z.string().uuid(),
  tenant_name: z.string(),
  plan_name: z.string().nullable(),
  mrr_contribution: z.number().nonnegative(),
  subscription_status: z.enum([
    "active",
    "trialing",
    "past_due",
    "canceled",
    "unpaid",
    "unknown",
  ]),
  current_period_end: z.string().nullable(),
  next_renewal_at: z.string().nullable(),
});

export const tenantFinancialsListDataSchema = z.object({
  items: z.array(tenantFinancialRowSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const financeKpisEnvelopeSchema = cockpitEnvelopeSchema(financeKpisDataSchema).extend({
  currency: cockpitCurrencySchema,
});

export const mrrByCoreEnvelopeSchema = cockpitEnvelopeSchema(mrrByCoreDataSchema).extend({
  currency: cockpitCurrencySchema,
});

export const tenantFinancialsListEnvelopeSchema = cockpitEnvelopeSchema(
  tenantFinancialsListDataSchema,
).extend({
  currency: cockpitCurrencySchema,
});

export type FinanceKpisEnvelope = z.infer<typeof financeKpisEnvelopeSchema>;
export type MrrByCoreEnvelope = z.infer<typeof mrrByCoreEnvelopeSchema>;
export type TenantFinancialRow = z.infer<typeof tenantFinancialRowSchema>;
export type TenantFinancialsListEnvelope = z.infer<typeof tenantFinancialsListEnvelopeSchema>;
