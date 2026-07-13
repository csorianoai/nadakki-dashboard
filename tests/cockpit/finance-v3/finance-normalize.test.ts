import {
  normalizeFinanceKpis,
  normalizeMrrByCore,
  normalizeTenantFinancialsList,
} from "@/lib/cockpit/finance-v3/normalize/finance";
import { formatCockpitMoney } from "@/lib/cockpit/finance-v3/format";
import { demoFinanceKpisRaw } from "@/lib/cockpit/demo-finance";

describe("finance-v3 normalize/finance", () => {
  test("normalizeFinanceKpis maps production flat response", () => {
    const env = normalizeFinanceKpis({
      data_source: "live",
      total_mrr: 0,
      arr_projected: 0,
      active_subscriptions: 18,
      tenants_managed: 18,
      tenants_unmanaged: 0,
    });
    expect(env.data_source).toBe("live");
    expect(env.currency).toBe("DOP");
    expect(env.data.total_mrr).toBe(0);
  });

  test("normalizeMrrByCore maps core_name to core_code", () => {
    const env = normalizeMrrByCore({
      data_source: "live",
      cores: [{ core_name: "credit_hub", display_name: "Credit Hub", mrr: 0, tenant_count: 18 }],
    });
    expect(env.data.cores[0]?.core_code).toBe("credit_hub");
  });

  test("demo envelope uses demo data_source", () => {
    const env = normalizeFinanceKpis(demoFinanceKpisRaw());
    expect(env.data_source).toBe("demo");
  });

  test("formatCockpitMoney shows em dash for none source", () => {
    expect(formatCockpitMoney(100, "es-DO", "DOP", "none")).toBe("—");
  });

  test("formatCockpitMoney formats zero MRR as RD$ with live source", () => {
    const formatted = formatCockpitMoney(0, "es-DO", "DOP", "live");
    expect(formatted).toContain("RD$");
    expect(formatted).not.toContain("MX$");
  });

  test("normalizeTenantFinancialsList validates list shape", () => {
    const env = normalizeTenantFinancialsList({
      data_source: "demo",
      items: [
        {
          tenant_id: "11111111-1111-4111-8111-111111111111",
          tenant_name: "Test",
          plan_name: "Free",
          mrr_contribution: 0,
          subscription_status: "active",
        },
      ],
    });
    expect(env.data.items).toHaveLength(1);
  });
});
