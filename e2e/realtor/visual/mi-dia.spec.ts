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

test("acceso denegado (403): no se pinta nada de la pantalla", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/mi-dia");
  await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("mi-dia-panel")).toHaveCount(0);
  await expect(page.getByTestId("shell-sidebar")).toHaveCount(0);
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
