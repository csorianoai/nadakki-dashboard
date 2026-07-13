import { z } from "zod";
import { cockpitCurrencySchema, cockpitEnvelopeSchema } from "../envelope";
import { tenantFinancialRowSchema } from "./finance";

/** Target contract for GET /api/v1/cockpit/finance/tenants/{id}/overview (F6 backend). */
export const tenantCoreCardSchema = z.object({
  core_code: z.string(),
  display_name: z.string(),
  users_count: z.number().int().nonnegative(),
  families: z.array(
    z.object({
      family: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  mrr_attributed: z.number().nonnegative().nullable(),
  activity_recent: z.string().nullable(),
});

export const tenantUserRowSchema = z.object({
  user_id: z.string().uuid(),
  email_masked: z.string(),
  role_key: z.string(),
  professional_family: z.string().nullable(),
  activity_score: z.number().nullable(),
  last_login_at: z.string().nullable(),
});

export const tenantConsolidatedDataSchema = z.object({
  tenant_id: z.string().uuid(),
  tenant_name: z.string(),
  tenant_slug: z.string(),
  country_code: z.string().nullable(),
  plan_name: z.string().nullable(),
  plan_status: z.string(),
  entity_type: z.string().nullable(),
  finance: tenantFinancialRowSchema,
  cores_enabled: z.array(tenantCoreCardSchema),
  users: z.array(tenantUserRowSchema),
});

export const tenantConsolidatedEnvelopeSchema = cockpitEnvelopeSchema(
  tenantConsolidatedDataSchema,
).extend({
  currency: cockpitCurrencySchema,
});

export type TenantConsolidatedEnvelope = z.infer<typeof tenantConsolidatedEnvelopeSchema>;
