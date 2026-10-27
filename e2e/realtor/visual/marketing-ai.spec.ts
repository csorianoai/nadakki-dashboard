import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * O2-P-MARKETING-AI sobre el armazón de RE-SHELL: /realtor/marketing-ai (DEMO) frente a la referencia DL10A con el umbral
 * de UMBRAL.md, más el caso sin DEMO (servidor 3101), el acceso denegado y el tenant ajeno.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/marketing-ai.png");

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

test("positivo con DEMO: marca, cuatro puertas con resumen y enlaces al core", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/marketing-ai");
  await expect(page.getByTestId("marketing-ai-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("summary-campaigns")).toContainText("SYNTH");
  await expect(page.getByTestId("open-campaigns")).toHaveAttribute("href", "/marketing/campaigns");
  await expect(page.getByTestId("center-marketing-ai")).toHaveAttribute("data-center-state", "live");
});

test("negativo sin DEMO: «Sin datos todavía», ninguna cifra ni marca DEMO", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/marketing-ai`);
  await expect(page.getByTestId("marketing-ai-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("summary-campaigns")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  expect(await page.getByTestId("marketing-ai-panel").innerText()).not.toMatch(/\d/);
});

const SUMMARY = {
  period: { from: "2026-10-01", to: "2026-10-16" },
  metrics: [
    { key: "campaigns_running", quality: "OK", value: 3, source: "marketing-core" },
    { key: "leads_attributed", quality: "NO_DISPONIBLE", value: null, reason: "SYNTH sin fuente" },
    { key: "suggestions_new", quality: "OK", value: 5, source: "marketing-core" },
  ],
  spend: [
    { kind: "sale", currency: "USD", campaigns: 2, spend: "800.00", budget: "1000.00", leads_attributed: 4, cost_per_lead: "200.00" },
    { kind: "rental", currency: "ARS", campaigns: 1, spend: "150000.00", budget: null, leads_attributed: 0, cost_per_lead: null },
  ],
};

test("datos reales (contrato C-RE-OLA3, registros SYNTH) sin DEMO: métricas, gasto por tipo y moneda y sin tenant en el cliente", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (/\/realestate\/marketing-ai/.test(r.url())) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/marketing-ai\/summary/, (route) => route.fulfill({ json: SUMMARY }));
  await page.goto(`${NODEMO}/realtor/marketing-ai`);
  await expect(page.getByTestId("marketing-ai-real")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("metric-campaigns_running")).toHaveText("3");
  await expect(page.getByTestId("metric-suggestions_new")).toHaveText("5");
  await expect(page.getByTestId("no-disponible-leads_attributed")).toHaveAttribute("data-quality", "NO_DISPONIBLE");
  await expect(page.getByTestId("no-disponible-leads_attributed")).toContainText("Sin datos todavía");
  await expect(page.getByTestId("spend-row")).toHaveCount(2);
  await expect(page.getByTestId("marketing-ai-real")).toContainText("800.00");
  await expect(page.getByTestId("marketing-ai-real")).toContainText("150000.00");
  await expect(page.getByTestId("marketing-ai-empty")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("endpoint 404/503 sin DEMO: sigue «Sin datos todavía»", async ({ page }) => {
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/marketing-ai\/summary/, (route) => route.fulfill({ status: 503, json: { detail: "down" } }));
  await page.goto(`${NODEMO}/realtor/marketing-ai`);
  await expect(page.getByTestId("marketing-ai-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("marketing-ai-real")).toHaveCount(0);
});

test("acceso denegado (403): nada de la pantalla ni del armazón", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/marketing-ai");
  await expect(page.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso", { timeout: 30_000 });
  await expect(page.getByTestId("marketing-ai-panel")).toHaveCount(0);
  await expect(page.getByTestId("realtor-shell")).toHaveCount(0);
  await expect(page.getByText(/SYNTH/)).toHaveCount(0);
});

test("tenant ajeno: ninguna petición del cliente lleva tenant", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/")) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.goto("/realtor/marketing-ai");
  await expect(page.getByTestId("marketing-ai-panel")).toBeVisible({ timeout: 30_000 });
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("captura a 1440×900 de /realtor/marketing-ai (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/marketing-ai");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("summary-campaigns")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("marketing-ai", { body: shot, contentType: "image/png" });

  // Misma reducción que shell.spec.ts: canvas 144×90, escala de grises, diferencia media absoluta (0–1).
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
