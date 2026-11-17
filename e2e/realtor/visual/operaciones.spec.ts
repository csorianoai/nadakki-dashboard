import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sesion } from "../sesion";

/**
 * O2-P-OPERACIONES sobre el armazón de RE-SHELL: /realtor/operaciones (DEMO) frente a la referencia DL10A con el umbral
 * de UMBRAL.md, más el caso sin DEMO (servidor 3101), el acceso denegado y el tenant ajeno.
 */

const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/operaciones.png");

const TOTAL = 7;
let pasados = 0;
let fallos = 0;
test.afterEach(({}, info) => void (info.status === "passed" ? (pasados += 1) : (fallos += 1)));
test.afterAll(() => console.log(`RESULT_O3_D_OPERACIONES=${fallos === 0 && pasados === TOTAL ? "PASS" : "FAIL"}`));


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

const OPS = { items: [
  { id: "00000000-0000-4000-8000-000000005201", tenant_id: "00000000-0000-4000-8000-0000000000a1", kind: "rental", status: "in_progress",
    property_id: "00000000-0000-4000-8000-00000000e001", listing_id: null, template_id: "00000000-0000-4000-8000-000000005101",
    agreed_price: { amount: "1800.00", currency: "USD" }, responsible_user_id: "00000000-0000-4000-8000-0000000000b1",
    opened_at: "2000-01-01T00:00:00Z", created_at: "2000-01-01T00:00:00Z", updated_at: "2000-01-01T00:00:00Z" },
  { id: "00000000-0000-4000-8000-000000005202", tenant_id: "00000000-0000-4000-8000-0000000000a1", kind: "sale", status: "draft",
    property_id: "00000000-0000-4000-8000-00000000e002", listing_id: null, template_id: "00000000-0000-4000-8000-000000005102",
    agreed_price: null, responsible_user_id: "00000000-0000-4000-8000-0000000000b1",
    opened_at: "2000-01-02T00:00:00Z", created_at: "2000-01-02T00:00:00Z", updated_at: "2000-01-02T00:00:00Z" },
], next_cursor: null };

test("datos reales (contrato C-RE-OLA3, registros SYNTH) sin DEMO: alquiler sin etapa, oportunidad de venta y sin tenant en el cliente", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (/\/realestate\/operations/.test(r.url())) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/operations/, (route) => route.fulfill({ json: OPS }));
  await page.goto(`${NODEMO}/realtor/operaciones`);
  await expect(page.getByTestId("unstaged-panel").getByTestId("op-row")).toHaveCount(1, { timeout: 30_000 });
  await expect(page.getByTestId("unstaged-panel")).toContainText("USD 1,800");
  await expect(page.getByTestId("opp-panel").getByTestId("op-row")).toHaveCount(1);
  await expect(page.getByTestId("stage-panel").getByTestId("op-row")).toHaveCount(0);
  await expect(page.getByTestId("operaciones-empty")).toHaveCount(0);
  await expect(page.getByTestId("fin-section")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("endpoint 404/503 sin DEMO: sigue «Sin datos todavía»", async ({ page }) => {
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/operations/, (route) => route.fulfill({ status: 503, json: { detail: "down" } }));
  await page.goto(`${NODEMO}/realtor/operaciones`);
  await expect(page.getByTestId("operaciones-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("op-row")).toHaveCount(0);
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
