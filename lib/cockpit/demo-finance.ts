const SYNTH = "11111111-1111-4111-8111-111111111111";

export function demoFinanceKpisRaw() {
  return {
    data_source: "demo" as const,
    total_mrr: 0,
    arr_projected: 0,
    active_subscriptions: 18,
    tenants_managed: 18,
    tenants_unmanaged: 0,
  };
}

export function demoMrrByCoreRaw() {
  return {
    data_source: "demo" as const,
    cores: [
      { core_code: "credit_hub", display_name: "Credit Hub", mrr: 0, tenant_count: 18 },
      { core_code: "legal", display_name: "Legal Core", mrr: 0, tenant_count: 12 },
      { core_code: "marketing", display_name: "Marketing", mrr: 0, tenant_count: 10 },
    ],
  };
}

export function demoTenantFinancialsListRaw() {
  return {
    data_source: "demo" as const,
    items: [
      {
        tenant_id: SYNTH,
        tenant_name: "Demo Tenant",
        plan_name: "Free",
        mrr_contribution: 0,
        subscription_status: "active",
        current_period_end: null,
        next_renewal_at: null,
      },
    ],
    total: 1,
    page: 1,
    page_size: 20,
  };
}
