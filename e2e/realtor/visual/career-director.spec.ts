import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Career Director sobre el armazón de RE-SHELL a 1440×900 frente a la referencia DL10A (Mi oficina, nav-11:
 * DL10A no tiene pantalla propia de Career Director), con el umbral de UMBRAL.md. Casos: DEMO, sin DEMO
 * (servidor 3101) y acceso denegado (403 → nada).
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/career-director.png");

async function sesion(page: Page, acceso: number) {
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "qa", display_name: "QA", subscribed_cores: ["real_estate"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant], active_roles: [],
    } }));
  await page.route(/\/api\/v1\/realestate\/acceso/, (route) =>
    route.fulfill({ status: acceso, json: acceso === 200 ? { ok: true } : { detail: "forbidden" } }));
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
}

test("positivo: DEMO con sus marcas, licencia, supervisión, metas y NO_DISPONIBLE; el bloque de la barra ya es enlace", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/career-director");
  await expect(page.getByTestId("career-director-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Career Director");
  await expect(page.getByTestId("demo-banner")).toHaveText("DEMO · datos sintéticos");
  await expect(page.getByTestId("card-licencia")).toContainText("SYNTH-SL-0100");
  await expect(page.getByTestId("card-supervision")).toContainText("555-0100");
  await expect(page.getByTestId("goal")).toHaveCount(2);
  await expect(page.getByTestId("no-disponible-meta-cierres")).toContainText("NO_DISPONIBLE");
  await expect(page.getByTestId("career-director")).toHaveAttribute("href", "/realtor/career-director");
  await expect(page.getByTestId("career-director")).not.toContainText("Próximamente");
  await page.getByTestId("lang-toggle").click();
  await expect(page.getByTestId("demo-banner")).toHaveText("DEMO · synthetic data");
});

test("negativo: sin DEMO «Sin datos todavía», ninguna cifra ni rótulo DEMO", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/career-director`);
  await expect(page.getByTestId("career-director-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("career-empty")).toContainText("Sin datos todavía");
  await expect(page.getByTestId("goal")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  expect(await page.getByTestId("career-director-panel").innerText()).not.toMatch(/\d/);
});

const CAREER = {
  agent_user_id: "00000000-0000-4000-8000-000000009001",
  period: { from: "2026-10-01", to: "2026-10-16" },
  metrics: [
    { key: "closings_count", quality: "OK", value: 3, source: "re_operations" },
    { key: "showings_count", quality: "OK", value: 12, source: "re_calendar_events" },
    { key: "active_listings", quality: "NO_DISPONIBLE", value: null, reason: "SYNTH sin fuente" },
  ],
  closed_volume: [
    { kind: "rental", currency: "ARS", count: 1, total: "450000.00", basis: "monthly_rent" },
    { kind: "sale", currency: "USD", count: 2, total: "410000.00", basis: "sale_price" },
  ],
  achievements: [
    { key: "first_showing", earned_at: "2026-09-05T10:30:00Z", subject: { subject_type: "calendar_event", subject_id: "00000000-0000-4000-8000-000000000101" } },
    { key: "first_closing", earned_at: "2026-09-20T15:00:00Z", subject: null },
  ],
};

test("datos reales (contrato C-RE-OLA3, registros SYNTH) sin DEMO: métricas, volumen por moneda, logros y sin tenant en el cliente", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (/\/realestate\/career/.test(r.url())) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/career\/me/, (route) => route.fulfill({ json: CAREER }));
  await page.goto(`${NODEMO}/realtor/career-director`);
  await expect(page.getByTestId("career-real")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("metric-closings_count")).toHaveText("3");
  await expect(page.getByTestId("metric-showings_count")).toHaveText("12");
  await expect(page.getByTestId("no-disponible-active_listings")).toContainText("NO_DISPONIBLE");
  await expect(page.getByTestId("volume-row")).toHaveCount(2);
  await expect(page.getByTestId("card-volumen")).toContainText("410000.00 USD");
  await expect(page.getByTestId("card-volumen")).toContainText("450000.00 ARS");
  await expect(page.getByTestId("achievement")).toHaveCount(2);
  await expect(page.getByTestId("career-empty")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("endpoint 404/503 sin DEMO: sigue «Sin datos todavía»", async ({ page }) => {
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/career\/me/, (route) => route.fulfill({ status: 503, json: { detail: "down" } }));
  await page.goto(`${NODEMO}/realtor/career-director`);
  await expect(page.getByTestId("career-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("career-real")).toHaveCount(0);
});

test("acceso denegado: 403 no pinta nada del centro", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/career-director");
  await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("career-director-panel")).toHaveCount(0);
  await expect(page.getByTestId("shell-sidebar")).toHaveCount(0);
  await expect(page.getByText("SYNTH")).toHaveCount(0);
});

test("captura a 1440×900 de /realtor/career-director (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/career-director");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("card-licencia")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("career-director", { body: shot, contentType: "image/png" });

  const diff = await page.evaluate(async ({ a, b }) => {
    const gray = async (b64: string) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = 144; c.height = 90;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 144, 90);
      const d = ctx.getImageData(0, 0, 144, 90).data;
      const out: number[] = [];
      for (let i = 0; i < d.length; i += 4) out.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      return out;
    };
    const [x, y] = [await gray(a), await gray(b)];
    return x.reduce((s, v, i) => s + Math.abs(v - y[i]), 0) / x.length / 255;
  }, { a: shot.toString("base64"), b: readFileSync(REF).toString("base64") });
  console.log(`DIFF_MEDIA=${(diff * 100).toFixed(2)}%`);
  expect(diff).toBeLessThanOrEqual(THRESHOLD);
});
