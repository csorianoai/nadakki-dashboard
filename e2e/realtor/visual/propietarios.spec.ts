import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sesion } from "../sesion";

/**
 * O2-P-PROPIETARIOS sobre el armazón de RE-SHELL: /realtor/propietarios (DEMO) frente a la referencia DL10A con el umbral
 * de docs/design/realtor/propietarios/UMBRAL.md, más el caso sin DEMO (servidor 3101), el acceso denegado y el tenant ajeno.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/propietarios.png");


test("positivo con DEMO: marca, tabla de propietarios, conteos por rol y centro vivo", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/propietarios");
  await expect(page.getByTestId("propietarios-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("owner-row")).toHaveCount(3);
  await expect(page.getByTestId("count-arrendador")).toHaveText("Arrendador · 2");
  await expect(page.getByTestId("center-propietarios")).toHaveAttribute("data-center-state", "live");
  await page.getByLabel("Rol", { exact: true }).selectOption("vendedor");
  await expect(page.getByTestId("owner-row")).toHaveCount(1);
});

test("negativo sin DEMO: «Sin datos todavía», ninguna cifra ni marca DEMO", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/propietarios`);
  await expect(page.getByTestId("propietarios-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("owner-row")).toHaveCount(0);
  await expect(page.getByTestId("role-counts")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  expect(await page.getByTestId("propietarios-panel").innerText()).not.toMatch(/\d/);
});

const OWNERS = { items: [
  { contact: { id: "00000000-0000-4000-8000-00000000c001", kind: "person", display_label: "SYNTH A.", source: "inbound_lead",
      owner_user_id: "00000000-0000-4000-8000-0000000000f1", active_roles: ["landlord"], primary_points: [], created_at: "2000-01-01T00:00:00Z" },
    owner_roles: ["landlord"], mandates_active: 1, properties_count: 2, metrics: [] },
  { contact: { id: "00000000-0000-4000-8000-00000000c002", kind: "person", display_label: "SYNTH B.", source: "inbound_lead",
      owner_user_id: "00000000-0000-4000-8000-0000000000f1", active_roles: ["seller"], primary_points: [], created_at: "2000-01-01T00:00:00Z" },
    owner_roles: ["seller"], mandates_active: 0, properties_count: 1, metrics: [] },
], next_cursor: null };

test("datos reales (contrato C-RE-OLA3, registros SYNTH) sin DEMO: tabla, conteos por rol y sin tenant en el cliente", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (/\/realestate\/owners/.test(r.url())) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/owners/, (route) => route.fulfill({ json: OWNERS }));
  await page.goto(`${NODEMO}/realtor/propietarios`);
  await expect(page.getByTestId("owner-row")).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByTestId("owner-row").first()).toContainText("SYNTH A.");
  await expect(page.getByTestId("count-arrendador")).toHaveText("Arrendador · 1");
  await expect(page.getByTestId("count-vendedor")).toHaveText("Vendedor · 1");
  await expect(page.getByTestId("propietarios-empty")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("endpoint 404/503 sin DEMO: sigue «Sin datos todavía»", async ({ page }) => {
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/owners/, (route) => route.fulfill({ status: 503, json: { detail: "down" } }));
  await page.goto(`${NODEMO}/realtor/propietarios`);
  await expect(page.getByTestId("propietarios-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("owner-row")).toHaveCount(0);
});

test("acceso denegado (403): nada de la pantalla ni del armazón", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/propietarios");
  await expect(page.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso", { timeout: 30_000 });
  await expect(page.getByTestId("propietarios-panel")).toHaveCount(0);
  await expect(page.getByTestId("realtor-shell")).toHaveCount(0);
  await expect(page.getByText(/SYNTH/)).toHaveCount(0);
});

test("tenant ajeno: ninguna petición del cliente lleva tenant", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/")) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.goto("/realtor/propietarios");
  await expect(page.getByTestId("propietarios-panel")).toBeVisible({ timeout: 30_000 });
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("captura a 1440×900 de /realtor/propietarios (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/propietarios");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("owner-row")).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("propietarios", { body: shot, contentType: "image/png" });

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
