import { test, expect, type Page, type Request } from "@playwright/test";

/**
 * PI-D2: /realtor/property-intel/<propiedad> con respuestas simuladas según C-PI 1.0.0 (HQ sintético, tenant QA).
 * 3100 = build con DEMO; 3101 = build sin DEMO. Sin credenciales ni datos personales.
 */
const B = "http://backend.invalid";
const NODEMO = "http://127.0.0.1:3101";
const QA_TENANT = "9a9a0001-0000-4000-8000-000000000001";
const HQ = "9a9a0001-0000-4000-8000-0000000000a1";
const T = "2026-10-01T12:00:00Z";

const link = (id: string, status: string, over: Record<string, unknown> = {}) => ({
  id, tenant_id: QA_TENANT, advertiser_ref: `anunciante-${id}`, property_id: HQ, property_unit_id: null, listing_id: null, campaign_ref: null,
  status, confidence: 0.9, evidence: [{ kind: "landing_domain_match", observed_at: T }], status_reason: null,
  confirmed_by_user_id: null, confirmed_at: null, created_at: T, updated_at: T, ...over,
});
const doc = (id: string, status: string) => ({ id, status, mime_type: "application/pdf", size_bytes: 1024, property_id: HQ, property_unit_id: null, listing_id: null, retention_until: null, license_restrictions: null, created_at: T });
const page_ = (data: unknown[]) => ({ data, next_cursor: null });

type Opts = { policy?: Record<string, unknown> | number; links?: unknown[]; signals?: number; decision?: number };

async function sesion(page: Page, o: Opts = {}) {
  const peticiones: Request[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/v1/realestate/property-intel")) peticiones.push(r); });
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) => route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: QA_TENANT, slug: "qa", display_name: "QA", subscribed_cores: ["real_estate"] };
  await page.route(`${B}/api/v2/auth/me`, (route) => route.fulfill({ json: {
    user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
    current_tenant: tenant, all_tenants: [tenant], active_roles: [],
  } }));
  await page.route(/\/api\/v1\/realestate\/acceso/, (route) => route.fulfill({ json: { ok: true, roles: ["realtor_agent"] } }));
  let links = o.links ?? [link("l1", "proposed"), link("l2", "confirmed", { confirmed_at: T })];
  await page.route(/\/api\/v1\/realestate\/property-intel\//, (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname.replace(/^.*\/property-intel/, "");
    if (p.endsWith("/decision")) {
      if (o.decision && o.decision !== 200) return route.fulfill({ status: o.decision, json: { code: "CONFLICT", message: "no" } });
      links = links.map((l) => ((l as { id: string }).id === "l1" ? link("l1", "confirmed", { confirmed_at: T }) : l));
      return route.fulfill({ json: links[0] });
    }
    if (p === "/signal-refs") return o.signals ? route.fulfill({ status: o.signals, json: {} }) : route.fulfill({ json: page_([{ id: "s1", tenant_id: QA_TENANT, signal_id: "g1", signal_type: "keyword_stats", property_id: HQ, property_unit_id: null, listing_id: null, observed_at: T, created_at: T }]) });
    if (p === "/advertiser-links") return route.fulfill({ json: page_(links) });
    if (p === "/documents") return route.fulfill({ json: page_(u.searchParams.get("status") === "pending" ? [doc("d2", "pending")] : [doc("d1", "stored")]) });
    if (p.startsWith("/broker-policies/")) {
      if (typeof o.policy === "number") return route.fulfill({ status: o.policy, json: {} });
      return route.fulfill({ json: { property_id: HQ, registration_required: true, registration_status: "not_confirmed", prospect_submission_allowed: false, developer_links_allowed: false, agreement_ref: null, is_default: true, version: 0, ...o.policy } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
  return peticiones;
}

test("HQ: señales, hechos, competidores, documentos pending/stored y gate bloqueado; sin tenant en el navegador", async ({ page }) => {
  const reqs = await sesion(page);
  await page.goto(`/realtor/property-intel/${HQ}`);
  await expect(page.getByTestId("pi-screen")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("signal-row")).toHaveCount(1);
  await expect(page.getByTestId("facts-signals")).toHaveText("1");
  await expect(page.getByTestId("facts-confirmed")).toHaveText("1");
  await expect(page.getByTestId("facts-proposed")).toHaveText("1");
  await expect(page.getByTestId("facts-stored")).toHaveText("1");
  await expect(page.locator('[data-testid="doc-row"][data-status="pending"]')).toContainText("Pendiente");
  await expect(page.locator('[data-testid="doc-row"][data-status="stored"]')).toContainText("Almacenado");
  await expect(page.getByTestId("pi-gate")).toHaveAttribute("data-gate", "blocked");
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  for (const r of reqs) {
    expect(r.url()).not.toContain(B);
    expect(JSON.stringify(await r.allHeaders()).toLowerCase()).not.toContain("tenant");
    expect(r.url().toLowerCase()).not.toContain("tenant");
  }
});

test("confirmar un competidor propuesto es una decisión humana que envía POST con motivo", async ({ page }) => {
  await sesion(page);
  page.on("dialog", (d) => d.accept("Coincide el dominio"));
  await page.goto(`/realtor/property-intel/${HQ}`);
  await expect(page.getByTestId("link-row")).toHaveCount(2, { timeout: 30_000 });
  const post = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/advertiser-links/l1/decision"));
  await page.getByRole("button", { name: "Confirmar" }).click();
  expect((await post).postDataJSON()).toEqual({ decision: "confirmed", status_reason: "Coincide el dominio" });
  await expect(page.getByTestId("facts-confirmed")).toHaveText("2");
});

test("gate abierto solo con registro confirmado y envío permitido", async ({ page }) => {
  await sesion(page, { policy: { registration_status: "confirmed", prospect_submission_allowed: true, agreement_ref: "acuerdo-1", is_default: false, version: 2 } });
  await page.goto(`/realtor/property-intel/${HQ}`);
  await expect(page.getByTestId("pi-gate")).toHaveAttribute("data-gate", "open", { timeout: 30_000 });
});

test("404 de una sección la oculta; 503 muestra servicio no disponible; ninguna cifra inventada", async ({ page }) => {
  await sesion(page, { policy: 404, signals: 503 });
  await page.goto(`/realtor/property-intel/${HQ}`);
  await expect(page.getByTestId("pi-gate")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId("pi-signals-msg")).toContainText("no disponible");
  await expect(page.getByTestId("facts-signals")).toHaveText("—");
});

test("sin DEMO el HQ no se pinta sin respuesta del backend", async ({ page }) => {
  await sesion(page, { links: [], policy: 404, signals: 404 });
  await page.goto(`${NODEMO}/realtor/property-intel/${HQ}`);
  await expect(page.getByTestId("pi-links-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
});

test("identificador no UUID no llama a nada", async ({ page }) => {
  const reqs = await sesion(page);
  await page.goto("/realtor/property-intel/no-es-uuid");
  await expect(page.getByTestId("pi-bad-id")).toBeVisible({ timeout: 30_000 });
  expect(reqs).toHaveLength(0);
});
