import { z } from "zod";
import type { CockpitDataSource } from "../envelope";
import {
  tenantConsolidatedEnvelopeSchema,
  type TenantConsolidatedEnvelope,
} from "../contracts/tenant";
import { parseContract } from "../parse";

const VALID_SOURCES: readonly CockpitDataSource[] = [
  "live",
  "derived",
  "partial",
  "demo",
  "none",
  "stale",
  "error",
];

function coerceSource(raw: string): CockpitDataSource {
  if (VALID_SOURCES.includes(raw as CockpitDataSource)) return raw as CockpitDataSource;
  return raw === "live" ? "live" : "none";
}

const STATUS_MAP = {
  active: "active",
  trialing: "trialing",
  trial: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  cancelled: "canceled",
  unpaid: "unpaid",
  expired: "canceled",
} as const;

function mapSubscriptionStatus(
  raw: string,
): TenantConsolidatedEnvelope["data"]["finance"]["subscription_status"] {
  const key = raw.toLowerCase() as keyof typeof STATUS_MAP;
  return STATUS_MAP[key] ?? "unknown";
}

const rawTenantOverviewSchema = z.object({
  data_source: z.string(),
  as_of: z.string().optional(),
  currency: z.enum(["DOP", "USD"]).optional(),
  is_estimated: z.boolean().optional(),
  data: z.object({
    tenant_id: z.string().uuid(),
    tenant_name: z.string(),
    tenant_slug: z.string(),
    country_code: z.string().nullable().optional(),
    plan_name: z.string().nullable().optional(),
    plan_status: z.string(),
    entity_type: z.string().nullable().optional(),
    finance: z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      plan_name: z.string().nullable().optional(),
      mrr_contribution: z.number().nonnegative(),
      subscription_status: z.string(),
      current_period_end: z.string().nullable().optional(),
      next_renewal_at: z.string().nullable().optional(),
    }),
    cores_enabled: z.array(
      z.object({
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
      }),
    ),
    users: z.array(
      z.object({
        user_id: z.string().uuid(),
        email_masked: z.string(),
        role_key: z.string(),
        professional_family: z.string().nullable(),
        activity_score: z.number().nullable(),
        last_login_at: z.string().nullable(),
      }),
    ),
  }),
});

function envelopeMeta(source: CockpitDataSource, asOf?: string, isEstimated?: boolean) {
  return {
    data_source: source,
    as_of: asOf ?? new Date().toISOString(),
    is_estimated: isEstimated ?? (source === "derived" || source === "partial"),
    currency: "DOP" as const,
  };
}

export function normalizeTenantOverview(raw: unknown): TenantConsolidatedEnvelope {
  const parsed = parseContract(rawTenantOverviewSchema, raw, "rawTenantOverview");
  const source = coerceSource(parsed.data_source);
  const finance = parsed.data.finance;

  return parseContract(
    tenantConsolidatedEnvelopeSchema,
    {
      data: {
        tenant_id: parsed.data.tenant_id,
        tenant_name: parsed.data.tenant_name,
        tenant_slug: parsed.data.tenant_slug,
        country_code: parsed.data.country_code ?? null,
        plan_name: parsed.data.plan_name ?? null,
        plan_status: parsed.data.plan_status,
        entity_type: parsed.data.entity_type ?? null,
        finance: {
          tenant_id: finance.tenant_id,
          tenant_name: finance.tenant_name,
          plan_name: finance.plan_name ?? null,
          mrr_contribution: finance.mrr_contribution,
          subscription_status: mapSubscriptionStatus(finance.subscription_status),
          current_period_end: finance.current_period_end ?? null,
          next_renewal_at: finance.next_renewal_at ?? null,
        },
        cores_enabled: parsed.data.cores_enabled,
        users: parsed.data.users,
      },
      ...envelopeMeta(source, parsed.as_of, parsed.is_estimated),
    },
    "tenantConsolidatedEnvelope",
  );
}
