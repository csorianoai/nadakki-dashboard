import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_CENTERS, REALTOR_CENTERS } from "../../../lib/realtor/centers";

/**
 * Armazón de Realtor OS (DL10A): hitos del diseño con /acceso a 200 y a 403 (fail-closed) y comparación visual
 * de /realtor/demand-radar con la referencia del prototipo. El umbral y su porqué están en UMBRAL.md.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/demand_radar.png");
const ORDER = ["Mi día", "Clientes", "Propietarios", "Propiedades", "Marketing AI", "Demand Radar", "Operaciones", "Documentos", "Finanzas", "CRM", "Academia", "Mi oficina"];
const GROUPS = ["HOY", "CARTERA", "CRECIMIENTO IA", "OPERACIÓN", "RELACIÓN Y CARRERA"];

let fallos = 0;
test.afterEach(({}, info) => void (info.status !== info.expectedStatus && (fallos += 1)));
test.afterAll(() => console.log(`RESULT_O2_REGISTRO=${fallos === 0 ? "PASS" : "FAIL"}`));

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

test("con 200 de /acceso se pinta el armazón del diseño", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/demand-radar");
  const side = page.getByTestId("shell-sidebar");
  await expect(side).toBeVisible({ timeout: 30_000 });

  const labels = await side.locator('[data-testid^="center-"]:not([data-testid="center-search"]):not([data-testid="center-group"])').allInnerTexts();
  expect(labels.map((t) => t.split("\n")[0].trim())).toEqual(ORDER);
  expect(await side.getByTestId("center-group").allInnerTexts()).toEqual(GROUPS);

  // Lo esperado sale del registro: con href enlaza; sin href está deshabilitado y dice «Próximamente».
  for (const c of REALTOR_CENTERS) {
    const el = side.getByTestId(`center-${c.id}`);
    if (c.href) {
      await expect(el).toHaveAttribute("href", c.href);
    } else {
      await expect(el).toHaveAttribute("aria-disabled", "true");
      await expect(el).toContainText("Próximamente");
      expect(await el.getAttribute("href")).toBeNull();
    }
  }
  expect(ALL_CENTERS.some((c) => c.id === "demand-radar" && c.href)).toBe(true);
  await expect(page.getByTestId("career-director")).toContainText("Career Director · guía");
  for (const id of ["career-director", "smart-calendar"]) {
    const reg = ALL_CENTERS.find((c) => c.id === id)!;
    if (reg.href) await expect(page.getByTestId(id)).toHaveAttribute("href", reg.href);
    else await expect(page.getByTestId(id)).toContainText("Próximamente");
  }

  await expect(page.getByTestId("shell-crumb")).toContainText("Demand Radar");
  await expect(page.getByTestId("view-agente")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("view-broker").click();
  await expect(page.getByTestId("view-broker")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("demo-pill")).toHaveText("DEMO · datos sintéticos");
  await expect(page.getByTestId("demo-reset")).toBeVisible();
  await expect(page.getByTestId("shell-footer")).toContainText("DEMO · datos sintéticos");

  // Buscador de centros y tecla /.
  await page.getByTestId("view-agente").click();
  await page.keyboard.press("/");
  await expect(page.getByTestId("center-search")).toBeFocused();
  await page.keyboard.type("fin");
  await expect(side.getByTestId("center-finanzas")).toBeVisible();
  await expect(side.getByTestId("center-clientes")).toHaveCount(0);
});

test("con 403 de /acceso no se pinta el armazón", async ({ page }) => {
  await sesion(page, 403);
  await page.goto("/realtor/demand-radar");
  await expect(page.getByTestId("realtor-notice")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("realtor-shell")).toHaveCount(0);
  await expect(page.getByTestId("shell-sidebar")).toHaveCount(0);
  await expect(page.getByTestId("career-director")).toHaveCount(0);
  await expect(page.getByTestId("demo-pill")).toHaveCount(0);
  await expect(page.getByText("Smart Calendar")).toHaveCount(0);
});

test("captura a 1440×900 de /realtor/demand-radar frente a la referencia DL10A", async ({ page }, info) => {
  await sesion(page, 200);
  await page.goto("/realtor/demand-radar");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demand-radar-panel")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  await info.attach("demand-radar", { body: shot, contentType: "image/png" });

  // Reducción en el propio navegador: canvas a 144×90, escala de grises, diferencia media absoluta.
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
