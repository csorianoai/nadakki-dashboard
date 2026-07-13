import { z } from "zod";
import { coreCode } from "@/lib/cockpit/normalize";
import type { CockpitDataSource } from "../envelope";
import {
  financeKpisEnvelopeSchema,
  mrrByCoreEnvelopeSchema,
  tenantFinancialsListEnvelopeSchema,
  type FinanceKpisEnvelope,
  type MrrByCoreEnvelope,
  type TenantFinancialsListEnvelope,
} from "../contracts/finance";
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

const rawFinanceKpisSchema = z.object({
  data_source: z.string(),
  total_mrr: z.number().nonnegative(),
  arr_projected: z.number().nonnegative(),
  active_subscriptions: z.number().int().nonnegative(),
  tenants_managed: z.number().int().nonnegative(),
  tenants_unmanaged: z.number().int().nonnegative(),
});

const rawMrrByCoreSchema = z.object({
  data_source: z.string(),
  cores: z.array(
    z.object({
      core_name: z.string().optional(),
      core_code: z.string().optional(),
      code: z.string().optional(),
      display_name: z.string(),
      mrr: z.number().nonnegative(),
      tenant_count: z.number().int().nonnegative(),
    }),
  ),
});

const rawTenantFinancialsListSchema = z.object({
  data_source: z.string(),
  items: z.array(
    z.object({
      tenant_id: z.string().uuid(),
      tenant_name: z.string(),
      plan_name: z.string().nullable().optional(),
      mrr_contribution: z.number().nonnegative(),
      subscription_status: z.string(),
      current_period_end: z.string().nullable().optional(),
      next_renewal_at: z.string().nullable().optional(),
    }),
  ),
  total: z.number().int().nonnegative().optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().optional(),
  next_cursor: z.string().nullable().optional(),
});

function envelopeMeta(source: CockpitDataSource) {
  return {
    data_source: source,
    as_of: new Date().toISOString(),
    is_estimated: source === "derived" || source === "partial",
    currency: "DOP" as const,
  };
}

export function normalizeFinanceKpis(raw: unknown): FinanceKpisEnvelope {
  const parsed = parseContract(rawFinanceKpisSchema, raw, "rawFinanceKpis");
  const source = coerceSource(parsed.data_source);
  return parseContract(
    financeKpisEnvelopeSchema,
    {
      data: {
        total_mrr: parsed.total_mrr,
        arr_projected: parsed.arr_projected,
        active_subscriptions: parsed.active_subscriptions,
        tenants_managed: parsed.tenants_managed,
        tenants_unmanaged: parsed.tenants_unmanaged,
      },
      ...envelopeMeta(source),
    },
    "financeKpisEnvelope",
  );
}

export function normalizeMrrByCore(raw: unknown): MrrByCoreEnvelope {
  const parsed = parseContract(rawMrrByCoreSchema, raw, "rawMrrByCore");
  const source = coerceSource(parsed.data_source);
  return parseContract(
    mrrByCoreEnvelopeSchema,
    {
      data: {
        cores: parsed.cores.map((c) => ({
          core_code: coreCode(c) || c.core_name || "unknown",
          display_name: c.display_name,
          mrr: c.mrr,
          tenant_count: c.tenant_count,
        })),
      },
      ...envelopeMeta(source),
    },
    "mrrByCoreEnvelope",
  );
}

const STATUS_MAP = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "unpaid",
} as const;

function mapSubscriptionStatus(raw: string): TenantFinancialsListEnvelope["data"]["items"][0]["subscription_status"] {
  const key = raw.toLowerCase() as keyof typeof STATUS_MAP;
  return STATUS_MAP[key] ?? "unknown";
}

export function normalizeTenantFinancialsList(raw: unknown): TenantFinancialsListEnvelope {
  const parsed = parseContract(rawTenantFinancialsListSchema, raw, "rawTenantFinancialsList");
  const source = coerceSource(parsed.data_source);
  return parseContract(
    tenantFinancialsListEnvelopeSchema,
    {
      data: {
        items: parsed.items.map((row) => ({
          tenant_id: row.tenant_id,
          tenant_name: row.tenant_name,
          plan_name: row.plan_name ?? null,
          mrr_contribution: row.mrr_contribution,
          subscription_status: mapSubscriptionStatus(row.subscription_status),
          current_period_end: row.current_period_end ?? null,
          next_renewal_at: row.next_renewal_at ?? null,
        })),
        total: parsed.total ?? parsed.items.length,
        page: parsed.page ?? 1,
        page_size: parsed.page_size ?? (parsed.items.length || 20),
      },
      ...envelopeMeta(source),
    },
    "tenantFinancialsListEnvelope",
  );
}
