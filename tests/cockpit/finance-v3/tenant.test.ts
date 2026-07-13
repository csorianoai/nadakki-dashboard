import { tenantConsolidatedEnvelopeSchema } from "@/lib/cockpit/finance-v3/contracts/tenant";
import { normalizeTenantOverview } from "@/lib/cockpit/finance-v3/normalize/tenant";
import {
  fetchTenantOverview,
  reconcileTenantFinanceWithRevenue,
} from "@/lib/cockpit/api/tenant";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";
import { PlatformApiError } from "@/lib/platformApi";

jest.mock("@/lib/platformApi", () => ({
  PlatformApiError: class PlatformApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  platformFetch: jest.fn(),
}));

const { platformFetch } = jest.requireMock("@/lib/platformApi") as {
  platformFetch: jest.Mock;
};

const SYNTH_TENANT = "11111111-1111-4111-8111-111111111111";

const SAMPLE_OVERVIEW_RAW = {
  success: true,
  data_source: "live",
  currency: "DOP",
  as_of: "2026-07-13T12:00:00Z",
  is_estimated: false,
  data: {
    tenant_id: SYNTH_TENANT,
    tenant_name: "Test Tenant",
    tenant_slug: "test-tenant",
    country_code: "DO",
    plan_name: "Free",
    plan_status: "active",
    entity_type: "bank",
    finance: {
      tenant_id: SYNTH_TENANT,
      tenant_name: "Test Tenant",
      plan_name: "Free",
      mrr_contribution: 0,
      subscription_status: "active",
      current_period_end: null,
      next_renewal_at: null,
    },
    cores_enabled: [
      {
        core_code: "credit",
        display_name: "Credit Hub",
        users_count: 3,
        families: [{ family: "dealer", count: 2 }],
        mrr_attributed: 0,
        activity_recent: "active",
      },
    ],
    users: [
      {
        user_id: "22222222-2222-4222-8222-222222222222",
        email_masked: "a***@test.com",
        role_key: "dealer_admin",
        professional_family: "dealer",
        activity_score: 1,
        last_login_at: null,
      },
    ],
  },
};

describe("finance tenant overview", () => {
  test("normalizeTenantOverview parses backend envelope", () => {
    const env = normalizeTenantOverview(SAMPLE_OVERVIEW_RAW);
    expect(env.data.tenant_slug).toBe("test-tenant");
    expect(env.data.finance.subscription_status).toBe("active");
    tenantConsolidatedEnvelopeSchema.parse(env);
  });

  test("normalizeTenantOverview maps cancelled → canceled", () => {
    const raw = {
      ...SAMPLE_OVERVIEW_RAW,
      data: {
        ...SAMPLE_OVERVIEW_RAW.data,
        finance: {
          ...SAMPLE_OVERVIEW_RAW.data.finance,
          subscription_status: "cancelled",
        },
      },
    };
    const env = normalizeTenantOverview(raw);
    expect(env.data.finance.subscription_status).toBe("canceled");
  });

  test("fetchTenantOverview returns ok on success", async () => {
    platformFetch.mockResolvedValueOnce(SAMPLE_OVERVIEW_RAW);
    const result = await fetchTenantOverview("test-tenant");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.envelope.data.tenant_name).toBe("Test Tenant");
    }
    expect(platformFetch).toHaveBeenCalledWith(
      "/api/v1/cockpit/finance/tenants/test-tenant/overview",
    );
  });

  test("fetchTenantOverview maps 404 to not_found", async () => {
    platformFetch.mockRejectedValueOnce(new PlatformApiError(404, "Not Found"));
    const result = await fetchTenantOverview("missing");
    expect(result.status).toBe("not_found");
  });

  test("reconcileTenantFinanceWithRevenue detects mismatch", () => {
    const env = normalizeTenantOverview(SAMPLE_OVERVIEW_RAW);
    const result = reconcileTenantFinanceWithRevenue(env, {
      tenant_id: SYNTH_TENANT,
      tenant_name: "Test Tenant",
      plan_name: "Free",
      mrr_contribution: 100,
      subscription_status: "active",
      current_period_end: null,
      next_renewal_at: null,
    });
    expect(result.ok).toBe(false);
    expect(result.warnings[0]?.code).toBe("RECONCILIATION_MISMATCH");
  });

  test("reconcileTenantFinanceWithRevenue passes when aligned", () => {
    const env = normalizeTenantOverview(SAMPLE_OVERVIEW_RAW);
    const result = reconcileTenantFinanceWithRevenue(env, {
      tenant_id: SYNTH_TENANT,
      tenant_name: "Test Tenant",
      plan_name: "Free",
      mrr_contribution: 0,
      subscription_status: "active",
      current_period_end: null,
      next_renewal_at: null,
    });
    expect(result.ok).toBe(true);
  });

  test("COCKPIT_FINANCE_TENANT_DETAIL_ENABLED defaults true", () => {
    expect(COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_TENANT_DETAIL_ENABLED).toBe(true);
  });
});
