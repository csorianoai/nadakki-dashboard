import {
  financeKpisEnvelopeSchema,
  mrrByCoreEnvelopeSchema,
  tenantFinancialsListEnvelopeSchema,
} from "@/lib/cockpit/finance-v3/contracts/finance";
import {
  rawPopulationSummarySchema,
  populationSummaryEnvelopeSchema,
} from "@/lib/cockpit/finance-v3/contracts/population";
import { registryProfessionsEnvelopeSchema } from "@/lib/cockpit/finance-v3/contracts/registry";
import { tenantCoreMatrixEnvelopeSchema } from "@/lib/cockpit/finance-v3/contracts/matrix";
import { tenantConsolidatedEnvelopeSchema } from "@/lib/cockpit/finance-v3/contracts/tenant";
import { normalizePopulationSummary } from "@/lib/cockpit/finance-v3/normalize/population";
import { reconcileMrr, projectArr } from "@/lib/cockpit/finance-v3/reconciliation";
import { ContractViolationError, parseContract } from "@/lib/cockpit/finance-v3/parse";

const SYNTH_TENANT = "11111111-1111-4111-8111-111111111111";
const SYNTH_USER = "22222222-2222-4222-8222-222222222222";

describe("finance-v3 contracts", () => {
  test("raw population summary matches production router shape", () => {
    const raw = {
      success: true,
      data_source: "live",
      total_professionals: 44,
      total_entities: 20,
      total_digital_agents: 0,
      tenants_managed: 18,
    };
    expect(parseContract(rawPopulationSummarySchema, raw, "raw")).toEqual(raw);
  });

  test("normalizePopulationSummary wraps flat backend into envelope", () => {
    const raw = {
      data_source: "live",
      total_professionals: 44,
      total_entities: 20,
      total_digital_agents: 0,
      tenants_managed: 18,
    };
    const env = normalizePopulationSummary(raw);
    expect(env.data_source).toBe("live");
    expect(env.data.total_professionals).toBe(44);
    expect(env.data.total_entities_connected).toBe(20);
    parseContract(populationSummaryEnvelopeSchema, env, "envelope");
  });

  test("finance KPIs envelope requires currency and non-negative MRR", () => {
    const payload = {
      data: {
        total_mrr: 0,
        arr_projected: 0,
        active_subscriptions: 18,
        tenants_managed: 18,
        tenants_unmanaged: 0,
      },
      data_source: "live" as const,
      as_of: new Date().toISOString(),
      is_estimated: false,
      currency: "DOP" as const,
    };
    const parsed = parseContract(financeKpisEnvelopeSchema, payload, "financeKpis");
    expect(parsed.data.total_mrr).toBe(0);
    expect(parsed.currency).toBe("DOP");
  });

  test("finance KPIs rejects negative MRR", () => {
    const payload = {
      data: { total_mrr: -1, arr_projected: 0, active_subscriptions: 0, tenants_managed: 0, tenants_unmanaged: 0 },
      data_source: "live",
      as_of: new Date().toISOString(),
      is_estimated: false,
      currency: "DOP",
    };
    expect(() => parseContract(financeKpisEnvelopeSchema, payload, "financeKpis")).toThrow(
      ContractViolationError,
    );
  });

  test("mrr by core envelope validates items", () => {
    const payload = {
      data: {
        cores: [
          { core_code: "credit_hub", display_name: "Credit Hub", mrr: 0, tenant_count: 18 },
        ],
      },
      data_source: "live" as const,
      as_of: new Date().toISOString(),
      is_estimated: false,
      currency: "DOP" as const,
    };
    parseContract(mrrByCoreEnvelopeSchema, payload, "mrrByCore");
  });

  test("tenant financials list uses synthetic tenant id only", () => {
    const payload = {
      data: {
        items: [
          {
            tenant_id: SYNTH_TENANT,
            tenant_name: "Test Tenant",
            plan_name: "Free",
            mrr_contribution: 0,
            subscription_status: "active" as const,
            current_period_end: null,
            next_renewal_at: null,
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      },
      data_source: "live" as const,
      as_of: new Date().toISOString(),
      is_estimated: false,
      currency: "DOP" as const,
    };
    parseContract(tenantFinancialsListEnvelopeSchema, payload, "tenantFinancials");
  });

  test("registry profession enforces snake_case role_code", () => {
    const payload = {
      data: {
        core: "credit",
        items: [
          {
            id: SYNTH_USER,
            core: "credit",
            role_code: "dealer_admin",
            display_name: "Dealer Admin",
            family: "dealers",
            description: null,
            sort_order: 1,
            active: true,
          },
        ],
      },
      data_source: "live" as const,
      as_of: new Date().toISOString(),
      is_estimated: false,
      warnings: [{ code: "STALE_CACHE" as const, severity: "info" as const, message: "ok" }],
    };
    parseContract(registryProfessionsEnvelopeSchema, payload, "registryProfessions");
    expect(() =>
      parseContract(registryProfessionsEnvelopeSchema, {
        ...payload,
        data: {
          ...payload.data,
          items: [{ ...payload.data.items[0], role_code: "Bad Code" }],
        },
      }, "bad"),
    ).toThrow(ContractViolationError);
  });

  test("matrix envelope accepts nullable cells", () => {
    const payload = {
      data: {
        metric: "active_users" as const,
        period: "7d",
        cores: [{ core_code: "credit_hub", display_name: "Credit Hub" }],
        tenants: [
          {
            tenant_id: SYNTH_TENANT,
            tenant_name: "Test",
            tenant_slug: "test",
            cells: { credit_hub: { value: 0, display: "0" } },
          },
        ],
      },
      data_source: "live" as const,
      as_of: new Date().toISOString(),
      is_estimated: false,
    };
    parseContract(tenantCoreMatrixEnvelopeSchema, payload, "matrix");
  });

  test("tenant consolidated envelope validates overview shape", () => {
    const payload = {
      data: {
        tenant_id: SYNTH_TENANT,
        tenant_name: "Test",
        tenant_slug: "test",
        country_code: "DO",
        plan_name: "Free",
        plan_status: "active",
        entity_type: null,
        finance: {
          tenant_id: SYNTH_TENANT,
          tenant_name: "Test",
          plan_name: "Free",
          mrr_contribution: 0,
          subscription_status: "active" as const,
          current_period_end: null,
          next_renewal_at: null,
        },
        cores_enabled: [],
        users: [],
      },
      data_source: "live" as const,
      as_of: new Date().toISOString(),
      is_estimated: false,
      currency: "DOP" as const,
    };
    parseContract(tenantConsolidatedEnvelopeSchema, payload, "tenantOverview");
  });
});

describe("finance-v3 reconciliation", () => {
  test("ARR equals MRR times 12", () => {
    expect(projectArr(1000)).toBe(12000);
    expect(projectArr(0)).toBe(0);
  });

  test("free tenants reconcile to zero", () => {
    const rows = [
      { mrr_contribution: 0 },
      { mrr_contribution: 0 },
    ];
    const cores = [{ mrr: 0 }, { mrr: 0 }];
    const result = reconcileMrr(0, rows, cores);
    expect(result.ok).toBe(true);
    expect(result.arr).toBe(0);
  });

  test("detects tenant sum mismatch", () => {
    const result = reconcileMrr(100, [{ mrr_contribution: 50 }], [{ mrr: 100 }]);
    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
