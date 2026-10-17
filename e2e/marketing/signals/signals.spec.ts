/**
 * PI-D1 — Mercado › Señales. Inicia sesión con el usuario QA (QA_USER, QA_PASSWORD, QA_TENANT_SLUG) en BASE_URL,
 * SOLO tenant QA. Las respuestas de /api/v1/market-signals se sustituyen por datos SINTÉTICOS del tenant QA
 * (page.route) para fijar cada estado: datos, vacío, 401 y 404 sin entitlement.
 */
import { expect, test, type Page } from "@playwright/test";
import { login } from "../../bank-v2/login";

const TENANT_QA = "9a9a0001-0000-4000-8000-000000000001";
const META = { cost_cents: 0, cached: false, provider_status: "configured", budget: { period: "month", currency: "USD", cap_cents: 0, consumed_cents: 0, remaining_cents: 0 }, schema_version: 1 };
const sintetica = (over: Record<string, unknown>) => ({
  schema_version: 1, signal_id: "00000000-0000-4000-8000-0000000000a1", tenant_id: TENANT_QA, signal_type: "keyword_stats",
  subject: "synth casas", geo: { country: "US" }, values: { kind: "keyword_stats", cpc_cents: 85 }, unit: null,
  observed_at: "2026-10-01T00:00:00Z", window: { start: "2026-09-01", end: "2026-09-30" },
  data_status: "ESTIMATED", evidence_tier: "estimado", unavailable_reason: null, coverage: 0.5, uncertainty: null,
  provenance: { source: "spyfu", as_of: "2026-10-01", status: "ESTIMATED", confidence: "low", method: "SYNTH" }, ...over,
});

const SENALES = /\/api\/v1\/market-signals\//;
async function responder(page: Page, status: number, body?: unknown) {
  await page.route(SENALES, (r) => r.fulfill({ status, contentType: "application/json", body: body === undefined ? "" : JSON.stringify(body) }));
}
async function buscar(page: Page) {
  await page.getByLabel("Palabra clave").fill("synth casas");
  await page.getByRole("button", { name: "Buscar" }).click();
}

test.describe("PI-D1 señales de mercado", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
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
