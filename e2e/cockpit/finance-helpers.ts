import { Buffer } from "buffer";
import type { Page } from "@playwright/test";

export const COCKPIT_E2E_TOKEN_KEY = "nadakki_sic_token";
export const COCKPIT_E2E_REFRESH_KEY = "nadakki_refresh_token_v2";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const RENDER_API = "https://nadakki-ai-suite.onrender.com";

export function makeCockpitE2eJwt(roleKey: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "e2e-user",
      email: roleKey === "platform_superadmin" ? "demo.admin@nadakki-demo.com" : "dealer@tenant.test",
      tid: TENANT_ID,
      tslug: "demo-tenant",
      roles: [{ core_name: "platform", role_key: roleKey, display_name: roleKey }],
    }),
  ).toString("base64url");
  return `${header}.${payload}.e2e`;
}

export function meResponse(roleKey: string) {
  return {
    user: {
      id: "e2e-user-id",
      email: roleKey === "platform_superadmin" ? "demo.admin@nadakki-demo.com" : "dealer@tenant.test",
      is_active: true,
      mfa_enabled: false,
    },
    current_tenant: {
      id: TENANT_ID,
      slug: "demo-tenant",
      display_name: "Demo Tenant",
      subscribed_cores: ["credit", "legal"],
    },
    all_tenants: [
      {
        id: TENANT_ID,
        slug: "demo-tenant",
        display_name: "Demo Tenant",
        subscribed_cores: ["credit", "legal"],
      },
    ],
    active_roles: [{ core_name: "platform", role_key: roleKey, display_name: roleKey }],
  };
}

export const FINANCE_STUBS = {
  kpis: {
    success: true,
    data_source: "live",
    total_mrr: 0,
    arr_projected: 0,
    active_subscriptions: 18,
    tenants_managed: 18,
    tenants_unmanaged: 0,
  },
  mrrByCore: {
    success: true,
    data_source: "live",
    cores: [
      { core_name: "credit", display_name: "Credit Hub", mrr: 0, tenant_count: 12 },
      { core_name: "legal", display_name: "Legal Hub", mrr: 0, tenant_count: 8 },
    ],
  },
  populationSummary: {
    success: true,
    data_source: "live",
    total_professionals: 44,
    total_entities: 20,
    total_digital_agents: 0,
    tenants_managed: 18,
  },
  matrixMrr: {
    success: true,
    metric: "mrr",
    period: "current",
    data_source: "live",
    aggregation_type: "SUM",
    rows: [
      {
        tenant_id: TENANT_ID,
        tenant_slug: "demo-tenant",
        tenant_name: "Demo Tenant",
        plan_code: "free",
        country: "DO",
        cells: [
          { core_code: "credit", value: 0, display_value: "0", data_source: "live" },
        ],
        row_total: { value: 0, display_value: "0" },
      },
    ],
    totals_per_column: [{ core_code: "credit", value: 0, display_value: "0" }],
    grand_total: { value: 0, display_value: "0" },
    has_more: false,
    total_rows: 18,
    warnings: [],
  },
  tenantOverview: {
    success: true,
    data_source: "live",
    currency: "DOP",
    as_of: "2026-07-13T21:00:00Z",
    is_estimated: false,
    data: {
      tenant_id: TENANT_ID,
      tenant_name: "Demo Tenant",
      tenant_slug: "demo-tenant",
      country_code: "DO",
      plan_name: "Free",
      plan_status: "active",
      entity_type: "bank",
      finance: {
        tenant_id: TENANT_ID,
        tenant_name: "Demo Tenant",
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
          email_masked: "d***@demo.com",
          role_key: "dealer_admin",
          professional_family: "dealer",
          activity_score: 1,
          last_login_at: null,
        },
      ],
    },
    warnings: [],
  },
  anchor: {
    success: true,
    ok: true,
    priority: null,
    epsilon: 0,
    sources: {
      kpis_total_mrr: 0,
      mrr_by_core_sum: 0,
      matrix_unique_tenant_mrr: 0,
      overview_tenant_mrr_sum: 0,
      overview_tenant_count: 18,
      db_mrr_all_sum: 0,
      matrix_total_rows: 18,
    },
    mismatches: [],
    notes: [],
  },
};

export async function setupCockpitE2e(
  context: import("@playwright/test").BrowserContext,
  page: Page,
  roleKey: string,
) {
  const token = makeCockpitE2eJwt(roleKey);
  const me = meResponse(roleKey);

  await context.route("**/api/v2/auth/refresh", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-token", expires_in: 3600 }),
    });
  });

  await context.route("**/api/v2/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(me),
    });
  });

  await seedCockpitAuth(page, roleKey);
  await stubCockpitFinanceApis(page);
}

export async function seedCockpitAuth(page: Page, roleKey: string) {
  const token = makeCockpitE2eJwt(roleKey);
  const me = meResponse(roleKey);

  await page.addInitScript(
    ({ tok, refresh, mePayload, role }: { tok: string; refresh: string; mePayload: object; role: string }) => {
      localStorage.setItem("nadakki_auth", "true");
      localStorage.setItem("nadakki_tenant_id", "11111111-1111-4111-8111-111111111111");
      localStorage.setItem("nadakki_role", role);
      localStorage.setItem("nadakki_sic_token", tok);
      localStorage.setItem("nadakki_refresh_token_v2", refresh);

      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("/api/v2/auth/refresh")) {
          return new Response(
            JSON.stringify({ access_token: tok, refresh_token: refresh, expires_in: 3600 }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (url.includes("/api/v2/auth/me")) {
          return new Response(JSON.stringify(mePayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return origFetch(input, init);
      };
    },
    { tok: token, refresh: "e2e-refresh-token", mePayload: me, role: roleKey },
  );
}

export async function waitForSessionReady(page: Page) {
  await page.waitForFunction(
    () => {
      const t = document.body?.innerText ?? "";
      return !t.includes("Verificando sesion") && !t.includes("Verificando permisos");
    },
    { timeout: 25_000 },
  );
}

export async function stubCockpitFinanceApis(page: Page) {
  const s = FINANCE_STUBS;

  const fulfillCockpit = async (route: import("@playwright/test").Route) => {
    const url = route.request().url();
    if (url.includes("/finance/kpis")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.kpis) });
    } else if (url.includes("/finance/mrr/by-core")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.mrrByCore) });
    } else if (url.includes("/finance/tenants/financials")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data_source: "live",
          items: [{ tenant_id: TENANT_ID, tenant_name: "Demo Tenant", plan_name: "Free", mrr_contribution: 0, subscription_status: "active" }],
          total: 1, page: 1, page_size: 20,
        }),
      });
    } else if (url.includes("/finance/matrix")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.matrixMrr) });
    } else if (url.includes("/overview")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.tenantOverview) });
    } else if (url.includes("/reconciliation/anchor")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.anchor) });
    } else if (url.includes("/population/")) {
      if (url.includes("/summary")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(s.populationSummary) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data_source: "live", professions: [] }) });
      }
    } else if (url.includes("/registry/")) {
      if (url.includes("entity-types")) {
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({ success: true, data_source: "live", items: [{ id: "1", code: "bank", display_name: "Banco", is_active: true }], warnings: [] }),
        });
      } else {
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({ success: true, data_source: "live", items: [{ id: "p1", core_name: "credit", role_code: "dealer_admin", display_name: "Dealer Admin", family: "dealer", is_active: true }], warnings: [] }),
        });
      }
    } else if (url.includes("/observability/")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { semaphore: "green" } }) });
    } else if (url.includes("/tenant-admin/")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tenants: [{ id: TENANT_ID, name: "Demo Tenant" }] }) });
    } else {
      await route.continue();
    }
  };

  await page.route("**/api/v1/cockpit/**", fulfillCockpit);
  await page.route("**://nadakki-ai-suite.onrender.com/api/v1/cockpit/**", fulfillCockpit);
}
