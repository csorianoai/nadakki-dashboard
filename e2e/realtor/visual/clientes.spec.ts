import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * O2-P-CLIENTES sobre el armazón de RE-SHELL: /realtor/clientes (DEMO) frente a la referencia DL10A con el umbral
 * de UMBRAL.md, más el caso sin DEMO (servidor 3101), el acceso denegado y el tenant ajeno.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const NODEMO = "http://127.0.0.1:3101";
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/clientes.png");

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

test("positivo con DEMO: marca, lista de clientes, conteos y ficha enmascarada", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/clientes");
  await expect(page.getByTestId("clientes-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-pill")).toBeVisible();
  await expect(page.getByTestId("contact-row")).toHaveCount(3);
  await expect(page.getByTestId("ficha-phone")).toHaveText("•••-•••-0101");
  await expect(page.getByTestId("center-clientes")).toHaveAttribute("data-center-state", "live");
  await page.getByTestId("tab-leads").click();
  await expect(page.getByTestId("contact-row")).toHaveCount(3);
});

test("negativo sin DEMO: «Sin datos todavía», ninguna cifra ni marca DEMO", async ({ page }) => {
  await sesion(page, 200);
  await page.goto(`${NODEMO}/realtor/clientes`);
  await expect(page.getByTestId("clientes-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
  await expect(page.getByTestId("contact-row")).toHaveCount(0);
  await expect(page.getByTestId("status-counts")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  expect(await page.getByTestId("clientes-panel").innerText()).not.toMatch(/\d/);
});

/** Página QA según C-RE-OLA2 (ClientSummary): registros SYNTH con etiquetas y puntos ya enmascarados. */
const CLIENTS_QA = {
  items: [
    { contact: { id: "00000000-0000-4000-8000-00000000c001", kind: "person", display_label: "SYNTH A.", source: "referral",
        owner_user_id: "00000000-0000-4000-8000-0000000000f1", active_roles: ["buyer"],
        primary_points: [{ type: "email", value_masked: "s***@e***.invalid" }, { type: "sms", value_masked: "***0101" }], created_at: "2000-01-01T00:00:00Z" },
      client_roles: ["buyer"], agreement_signed: true, agreement_signed_at: "2000-01-02T00:00:00Z" },
    { contact: { id: "00000000-0000-4000-8000-00000000c002", kind: "person", display_label: "SYNTH B.", source: "manual",
        owner_user_id: "00000000-0000-4000-8000-0000000000f1", active_roles: ["tenant"], primary_points: [], created_at: "2000-01-01T00:00:00Z" },
      client_roles: ["tenant"], agreement_signed: false, agreement_signed_at: null },
  ],
  next_cursor: null,
};

async function conClientes(page: Page, status: number, json: unknown) {
  await page.route(/\/api\/v1\/realestate\/clients/, (route) => route.fulfill({ status, json }));
}

test("datos reales sin DEMO (contrato C-RE-OLA2): filas SYNTH enmascaradas, sin banner DEMO ni tenant", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/clients")) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await conClientes(page, 200, CLIENTS_QA);
  await page.goto(`${NODEMO}/realtor/clientes`);
  await expect(page.getByTestId("contact-row")).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByTestId("contact-row").first()).toContainText("SYNTH A.");
  await expect(page.getByTestId("ficha-email")).toHaveText("s***@e***.invalid");
  await expect(page.getByTestId("ficha-phone")).toHaveText("***0101");
  await expect(page.getByTestId("clientes-empty")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("sin DEMO con 404/503 o lista vacía: sigue «Sin datos todavía»", async ({ page }) => {
  for (const [status, json] of [[404, { detail: "nf" }], [503, { detail: "off" }], [200, { items: [], next_cursor: null }]] as const) {
    await sesion(page, 200);
    await conClientes(page, status, json);
    await page.goto(`${NODEMO}/realtor/clientes`);
    await expect(page.getByTestId("clientes-empty")).toContainText("Sin datos todavía", { timeout: 30_000 });
    await expect(page.getByTestId("contact-row")).toHaveCount(0);
  }
});

test("acceso denegado (403): nada de la pantalla ni del armazón", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/clientes");
  await expect(page.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso", { timeout: 30_000 });
  await expect(page.getByTestId("clientes-panel")).toHaveCount(0);
  await expect(page.getByTestId("realtor-shell")).toHaveCount(0);
  await expect(page.getByText(/SYNTH/)).toHaveCount(0);
});

test("tenant ajeno: ninguna petición del cliente lleva tenant", async ({ page }) => {
  const peticiones: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/realestate/")) peticiones.push(`${r.url()} ${JSON.stringify(r.headers())}`); });
  await sesion(page, 200);
  await page.goto("/realtor/clientes");
  await expect(page.getByTestId("clientes-panel")).toBeVisible({ timeout: 30_000 });
  expect(peticiones.length).toBeGreaterThan(0);
  for (const p of peticiones) expect(p.toLowerCase()).not.toMatch(/tenant/);
});

test("captura a 1440×900 de /realtor/clientes (DEMO) frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/clientes");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("contact-row")).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("clientes", { body: shot, contentType: "image/png" });

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
