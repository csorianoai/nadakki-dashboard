/**
 * PI-D1 — Mercado › Señales, HERMÉTICO: sin login real, sin credenciales y sin red al backend. La sesión es un JWT de
 * prueba firmado con un secreto efímero de este proceso (nunca válido en ningún entorno). /acceso y las respuestas de /api/v1/market-signals se sustituyen por datos SINTÉTICOS del tenant QA
 * (page.route) para fijar cada estado: datos, vacío, 401 y 404 sin entitlement.
 */
import { expect, test, type Page } from "@playwright/test";
import { createHmac, randomBytes } from "node:crypto";

const TENANT_QA = "9a9a0001-0000-4000-8000-000000000001";
const META = { cost_cents: 0, cached: false, provider_status: "configured", budget: { period: "month", currency: "USD", cap_cents: 0, consumed_cents: 0, remaining_cents: 0 }, schema_version: 1 };
const sintetica = (over: Record<string, unknown>) => ({
  schema_version: 1, signal_id: "00000000-0000-4000-8000-0000000000a1", tenant_id: TENANT_QA, signal_type: "keyword_stats",
  subject: "synth casas", geo: { country: "US" }, values: { kind: "keyword_stats", cpc_cents: 85 }, unit: null,
  observed_at: "2026-10-01T00:00:00Z", window: { start: "2026-09-01", end: "2026-09-30" },
  data_status: "ESTIMATED", evidence_tier: "estimado", unavailable_reason: null, coverage: 0.5, uncertainty: null,
  provenance: { source: "spyfu", as_of: "2026-10-01", status: "ESTIMATED", confidence: "low", method: "SYNTH" }, ...over,
});

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwtDePrueba(): string {
  const cuerpo = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "synth-user", tenant_id: TENANT_QA, exp: Math.floor(Date.now() / 1000) + 3600 })}`;
  return `${cuerpo}.${createHmac("sha256", randomBytes(32)).update(cuerpo).digest("base64url")}`;
}

const SENALES = /\/api\/v1\/market-signals\//;
async function responder(page: Page, status: number, body?: unknown) {
  await page.route(SENALES, (r) => r.fulfill({ status, contentType: "application/json", body: body === undefined ? "" : JSON.stringify(body) }));
}
async function buscar(page: Page) {
  await page.getByLabel("Palabra clave").fill("synth casas");
  await page.getByRole("button", { name: "Buscar" }).click();
}

const CASOS = 5;
const pasados = new Set<string>();
const fallados = new Set<string>();

test.describe("PI-D1 señales de mercado", () => {
  test.afterEach(({}, testInfo) => {
    (testInfo.status === "passed" ? pasados : fallados).add(testInfo.title);
    if (testInfo.status !== "passed") pasados.delete(testInfo.title);
    else fallados.delete(testInfo.title);
  });

  test.afterAll(() => {
    if (pasados.size === CASOS && fallados.size === 0) console.log("RESULT_PI_D1=PASS");
  });

  test.beforeEach(async ({ page }) => {
    const jwt = jwtDePrueba();
    await page.addInitScript(() => window.localStorage.setItem("nadakki_refresh_token_v2", "synth-refresh"));
    const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    const json = (cuerpo: unknown) => ({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(cuerpo) });
    await page.route(/\/api\/v2\/auth\/(refresh|me)/, (r) => {
      if (r.request().method() === "OPTIONS") return r.fulfill({ status: 204, headers: CORS });
      if (/refresh/.test(r.request().url())) return r.fulfill(json({ access_token: jwt, refresh_token: "synth-refresh", expires_in: 3600 }));
      const tenant = { id: TENANT_QA, slug: "qa", display_name: "QA", subscribed_cores: ["realestate"], is_demo: false };
      return r.fulfill(json({
        user: { id: "synth-user", email: "synth@example.invalid", is_active: true, mfa_enabled: false }, current_tenant: tenant, all_tenants: [tenant],
        active_roles: [{ core_name: "realestate", role_key: "admin", display_name: "Admin" }],
      }));
    });
    await page.route(/\/api\/v1\/realestate\/acceso/, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ roles: ["agent"], demo: false }) }));
    await page.goto("/realtor/demand-radar/senales");
    await expect(page.getByTestId("signals-center")).toBeVisible();
  });

  test("datos SYNTH: ESTIMATED con procedencia y sin tenant en la petición", async ({ page }) => {
    const cabeceras: string[] = [];
    page.on("request", (r) => { if (SENALES.test(r.url())) cabeceras.push(JSON.stringify(r.headers()) + r.url()); });
    await responder(page, 200, { data: [sintetica({})], meta: META });
    await buscar(page);
    await expect(page.getByTestId("status-badge").first()).toHaveAttribute("data-status", "ESTIMATED");
    await expect(page.getByText("Procedencia")).toBeVisible();
    expect(cabeceras.length).toBeGreaterThan(0);
    for (const c of cabeceras) expect(c).not.toMatch(/x-tenant-id|tenant_id/i);
  });

  test("UNAVAILABLE: motivo y ninguna cifra", async ({ page }) => {
    await responder(page, 200, { data: [sintetica({ data_status: "UNAVAILABLE", unavailable_reason: "budget_exhausted", evidence_tier: "estimado", provenance: { source: "spyfu", as_of: "2026-10-01", status: "UNAVAILABLE", confidence: "none" } })], meta: META });
    await buscar(page);
    await expect(page.getByTestId("status-badge").first()).toHaveAttribute("data-status", "UNAVAILABLE");
    await expect(page.getByText(/presupuesto/).first()).toBeVisible();
    await expect(page.getByText(/cpc_cents/)).toHaveCount(0);
  });

  test("vacío", async ({ page }) => {
    await responder(page, 200, { data: [], meta: META });
    await buscar(page);
    await expect(page.getByTestId("signals-empty")).toBeVisible();
  });

  test("401: sesión expirada", async ({ page }) => {
    await responder(page, 401, { code: "UNAUTHENTICATED", message: "x" });
    await buscar(page);
    await expect(page.getByTestId("signals-notice")).toHaveAttribute("data-state", "session_expired");
  });

  test("404 sin entitlement: oculto", async ({ page }) => {
    await responder(page, 404, { code: "NOT_FOUND", message: "x" });
    await buscar(page);
    await expect(page.getByTestId("signals-notice")).toHaveAttribute("data-state", "hidden");
    await expect(page.getByTestId("signal-card")).toHaveCount(0);
  });
});
