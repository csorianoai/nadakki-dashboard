import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * O2-P-OPERACIONES sobre el armazón de RE-SHELL: /realtor/operaciones (DEMO) frente a la referencia DL10A con el umbral
 * de UMBRAL.md, más el caso sin DEMO (servidor 3101), el acceso denegado y el tenant ajeno.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/operaciones.png");

const TOTAL = 5;
let pasados = 0;
let fallos = 0;
test.afterEach(({}, info) => void (info.status === "passed" ? (pasados += 1) : (fallos += 1)));
test.afterAll(() => console.log(`RESULT_O2_F_OPERACIONES=${fallos === 0 && pasados === TOTAL ? "PASS" : "FAIL"}`));

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

test("positivo con DEMO: marca, etapas con conteos, expedientes de la etapa y oportunidades de venta", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/operaciones");
  await expect(page.getByTestId("operaciones-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("stage-list").getByRole("listitem")).toHaveCount(7);
  await expect(page.getByTestId("count-propiedad")).toContainText("1");
  await expect(page.getByTestId("stage-panel").getByTestId("op-row")).toHaveCount(1);
  await expect(page.getByTestId("opp-panel").getByTestId("op-row")).toHaveCount(2);
  await expect(page.getByTestId("center-operaciones")).toHaveAttribute("data-center-state", "live");
  await expect(page.getByTestId("fin-section")).toBeVisible();
  for (const id of ["fin-gross", "fin-fee", "fin-split", "fin-closed"]) await expect(page.getByTestId(id)).toBeVisible();
  await page.getByTestId("stage-firma").click();
  await expect(page.getByTestId("stage-empty")).toBeVisible();
});

test("negativo sin DEMO: «Sin datos todavía», ninguna cifra ni marca DEMO", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/operaciones`);
  await expect(page.getByTestId("operaciones-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("op-row")).toHaveCount(0);
  await expect(page.getByTestId("stage-list")).toHaveCount(0);
  await expect(page.getByTestId("fin-section")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  expect(await page.getByTestId("operaciones-panel").innerText()).not.toMatch(/\d/);
});

test("acceso denegado (403): nada de la pantalla ni del armazón", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/operaciones");
  await expect(page.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso", { timeout: 30_000 });
  await expect(page.getByTestId("operaciones-panel")).toHaveCount(0);
  await expect(page.getByTestId("realtor-shell")).toHaveCount(0);
  await expect(page.getByText(/SYNTH/)).toHaveCount(0);
});

test("tenant ajeno: ninguna petición del cliente lleva tenant", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/")) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.goto("/realtor/operaciones");
  await expect(page.getByTestId("operaciones-panel")).toBeVisible({ timeout: 30_000 });
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("captura a 1440×900 de /realtor/operaciones (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/operaciones");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("op-row")).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("operaciones", { body: shot, contentType: "image/png" });

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
