import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Mi día sobre el armazón de RE-SHELL: /realtor/mi-dia (DEMO) frente a la referencia DL10A (centro 0), con el umbral
 * de UMBRAL.md; caso sin DEMO (servidor 3101) y acceso denegado.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/mi-dia.png");

// Los textos se afirman en español: el idioma sale de navigator.language y no debe depender del LANG del entorno.
test.use({ locale: "es-ES" });

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

test("positivo: DEMO con sus marcas, filas SYNTH y pendientes del broker solo en vista Broker", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/mi-dia");
  await expect(page.getByTestId("mi-dia-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-demo")).toHaveText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("mi-dia-leads")).toContainText("SYNTH");
  await expect(page.getByTestId("mi-dia-desk")).toHaveCount(0);
  await page.getByTestId("view-broker").click();
  await expect(page.getByTestId("mi-dia-desk")).toBeVisible();
});

test("negativo: sin DEMO, «Sin datos todavía», NO_DISPONIBLE y ninguna cifra", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/mi-dia`);
  await expect(page.getByTestId("mi-dia-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-empty")).toContainText("Sin datos todavía");
  await expect(page.getByTestId("mi-dia-no-disponible")).toHaveCount(2);
  await expect(page.getByTestId("mi-dia-row")).toHaveCount(0);
  await expect(page.getByTestId("mi-dia-demo")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  expect(await page.getByTestId("mi-dia-panel").innerText()).not.toMatch(/\d/);
});

// Cuerpo con la forma de C-RE-OLA2 (MiDia): registros SYNTH, un id por lead y una sección sin fuente.
const MI_DIA_REAL = {
  generated_at: "2000-01-01T00:00:00Z", scope: "supervisor",
  leads_sin_primera_respuesta: { quality: "OK", count: 2, items: [
    { lead_id: "00000000-0000-4000-8000-00000000d001", channel: "web", intent: "rent", status: "new", received_at: "2000-01-01T00:00:00Z", waiting_hours: 3.5 },
    { lead_id: "00000000-0000-4000-8000-00000000d002", channel: "whatsapp", intent: "buy", status: "new", received_at: "2000-01-01T00:00:00Z", waiting_hours: 12 },
  ] },
  listings_con_requisitos_bloqueantes: { quality: "NO_DISPONIBLE", reason: "SYNTH: sin fuente hoy", count: null, items: [] },
  broker_desk_pendientes: { quality: "OK", count: 1, items: [
    { item_id: "00000000-0000-4000-8000-00000000d003", kind: "agent_activation", created_at: "2000-01-01T00:00:00Z" },
  ] },
};

test("datos reales (sin DEMO): filas del contrato, sección sin fuente en NO_DISPONIBLE y sin tenant del cliente", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/v1/realestate/mi-dia")) pedidos.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/mi-dia/, (route) => route.fulfill({ json: MI_DIA_REAL }));
  await page.goto(`${NODEMO}/realtor/mi-dia`);
  await expect(page.getByTestId("mi-dia-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-leads-count")).toHaveText("2");
  await expect(page.getByTestId("mi-dia-leads").getByTestId("mi-dia-row")).toHaveCount(2);
  await expect(page.getByTestId("mi-dia-leads")).toContainText("Web · alquiler");
  await expect(page.getByTestId("mi-dia-listings").getByTestId("mi-dia-no-disponible")).toHaveCount(1);
  await expect(page.getByTestId("mi-dia-empty")).toHaveCount(0);
  await expect(page.getByTestId("mi-dia-demo")).toHaveCount(0);
  await expect(page.getByTestId("mi-dia-desk")).toHaveCount(0);
  await page.getByTestId("view-broker").click();
  await expect(page.getByTestId("mi-dia-desk")).toContainText("Activación de agente");
  expect(pedidos.length).toBeGreaterThan(0);
  for (const p of pedidos) expect(p.toLowerCase()).not.toMatch(/x-tenant|tenant_id|tenant=/);
});

test("sin DEMO con 503 o lista vacía: sigue «Sin datos todavía»", async ({ page }) => {
  await sesion(page, 200);
  await page.route(/\/api\/v1\/realestate\/mi-dia/, (route) => route.fulfill({ status: 503, json: { detail: "down" } }));
  await page.goto(`${NODEMO}/realtor/mi-dia`);
  await expect(page.getByTestId("mi-dia-empty")).toContainText("Sin datos todavía");
  await expect(page.getByTestId("mi-dia-row")).toHaveCount(0);
  const vacio = { ...MI_DIA_REAL, leads_sin_primera_respuesta: { quality: "OK", count: 0, items: [] }, broker_desk_pendientes: { quality: "OK", count: 0, items: [] } };
  await page.route(/\/api\/v1\/realestate\/mi-dia/, (route) => route.fulfill({ json: vacio }));
  await page.reload();
  await expect(page.getByTestId("mi-dia-empty")).toContainText("Sin datos todavía");
  await expect(page.getByTestId("mi-dia-row")).toHaveCount(0);
});

test("acceso denegado (403): no se pinta nada de la pantalla", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/mi-dia");
  await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-panel")).toHaveCount(0);
  await expect(page.getByTestId("shell-sidebar")).toHaveCount(0);
});

test("tenant ajeno (404): pantalla vacía, sin filas y el tenant no viaja desde el cliente", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/v1/realestate/")) pedidos.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 404);
  await page.goto("/realtor/mi-dia");
  await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-panel")).toHaveCount(0);
  await expect(page.getByTestId("mi-dia-row")).toHaveCount(0);
  expect(pedidos.length).toBeGreaterThan(0);
  for (const p of pedidos) expect(p.toLowerCase()).not.toMatch(/x-tenant|tenant_id|tenant=/);
});

test("captura a 1440×900 de /realtor/mi-dia (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/mi-dia");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-leads")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("mi-dia", { body: shot, contentType: "image/png" });

  // Misma reducción que demand-radar.spec.ts: canvas 144×90, escala de grises, diferencia media absoluta (0–1).
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
