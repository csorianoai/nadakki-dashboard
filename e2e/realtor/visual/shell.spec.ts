import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_CENTERS } from "../../../lib/realtor/centers";
import { BROKER_ROLE, REALTOR_MENU, visibleMenu } from "../../../lib/realtor/menu";

/**
 * Armazón de Realtor OS (DL10A): hitos del diseño con /acceso a 200 y a 403 (fail-closed) y comparación visual
 * de /realtor/demand-radar con la referencia del prototipo. El umbral y su porqué están en UMBRAL.md.
 */

const B = "http://backend.invalid";
const THRESHOLD = 0.12;
/** Misma regla que ShellSidebar: Career Director conserva su testid histórico (career-director.spec.ts). */
const testidOf = (id: string) => (id === "career-director" ? "career-director" : `center-${id}`);
const REF = join(__dirname, "../../../docs/design/realtor/DL10A/ref/demand_radar.png");
let fallos = 0;
test.afterEach(({}, info) => void (info.status !== info.expectedStatus && (fallos += 1)));
test.afterAll(() => { console.log(`RESULT_O2_REGISTRO=${fallos === 0 ? "PASS" : "FAIL"}`); console.log(`RESULT_O2_F_MENU=${fallos === 0 ? "PASS" : "FAIL"}`); console.log(`RESULT_O3_FIX_PLATFORM_OPS_DEMO_UI=${fallos === 0 ? "PASS" : "FAIL"}`); console.log(`RESULT_O3_FIX_MENU_LATERAL=${fallos === 0 ? "PASS" : "FAIL"}`); });

/** Peticiones del navegador a /acceso: para comprobar que el cliente nunca manda tenant. */
async function sesion(page: Page, acceso: number, roles: string[] = [], vistas: string[] = [], demo?: unknown) {
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
    {
    vistas.push(`${route.request().url()} ${route.request().postData() ?? ""} ${JSON.stringify(route.request().headers())}`);
    return route.fulfill({ status: acceso, json: acceso === 200 ? { ok: true, roles, ...(demo === undefined ? {} : { demo }) } : { detail: "forbidden" } });
  });
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
}

test("Propietarios, Alta y Agente web son filas vivas de la barra", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/demand-radar");
  const side = page.getByTestId("shell-sidebar");
  await expect(side).toBeVisible({ timeout: 30_000 });
  for (const [id, href] of [["propietarios", "/realtor/propietarios"], ["alta", "/realtor/alta"], ["agente-web", "/realtor/agente-web"]]) {
    const fila = side.getByTestId(`center-${id}`);
    await expect(fila).toHaveAttribute("href", href);
    await expect(fila).toHaveAttribute("data-center-state", "live");
  }
});

test("demo:true en /acceso muestra el aviso de tenant DEMO; con demo:false no", async ({ page }) => {
  await sesion(page, 200, [], [], true);
  await page.goto("/realtor/demand-radar");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("tenant-demo")).toContainText("Tenant DEMO");
  await expect(page.getByTestId("tenant-demo")).toBeVisible();
  const otra = await page.context().newPage();
  await sesion(otra, 200, [], [], false);
  await otra.goto("/realtor/demand-radar");
  await expect(otra.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await expect(otra.getByTestId("tenant-demo")).toHaveCount(0);
});

test("con 200 de /acceso se pinta el armazón del diseño", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/demand-radar");
  const side = page.getByTestId("shell-sidebar");
  await expect(side).toBeVisible({ timeout: 30_000 });

  // Estructura esperada: sale de REALTOR_MENU (sin el rol, sin la Bandeja del broker).
  const esperado = visibleMenu([]);
  expect(await side.getByTestId("center-group").allInnerTexts()).toEqual(esperado.map((g) => g.label));
  const labels = await side.locator('[data-testid^="center-"]:not([data-testid="center-search"]):not([data-testid="center-group"]), [data-testid="career-director"]').allInnerTexts();
  expect(labels.map((t) => t.split("\n")[0].trim())).toEqual(esperado.flatMap((g) => g.items.map((i) => i.label)));
  expect(esperado.map((g) => g.label)).toHaveLength(4);
  await expect(side.getByTestId("center-finanzas")).toHaveCount(0);
  await expect(side.getByTestId("center-bandeja-broker")).toHaveCount(0);

  // Con href enlaza; sin href está deshabilitado, sin ruta, y lleva la marca «Pronto».
  for (const c of esperado.flatMap((g) => g.items)) {
    const el = side.getByTestId(testidOf(c.id));
    if (c.href) {
      await expect(el).toHaveAttribute("href", c.href);
    } else {
      await expect(el).toHaveAttribute("aria-disabled", "true");
      await expect(el).toContainText("Pronto");
      expect(await el.getAttribute("href")).toBeNull();
    }
  }
  expect(ALL_CENTERS.some((c) => c.id === "demand-radar" && c.href)).toBe(true);
  await expect(page.getByTestId("career-director")).toHaveAttribute("href", "/realtor/career-director");
  for (const id of ["smart-calendar"]) {
    const reg = ALL_CENTERS.find((c) => c.id === id)!;
    if (reg.href) await expect(page.getByTestId(id)).toHaveAttribute("href", reg.href);
    else await expect(page.getByTestId(id)).toContainText("Próximamente");
  }

  // Miga única (ROP-UX-QUICKFIX): la de la Suite nombra el centro y el armazón ya no pinta la suya.
  await expect(page.getByTestId("barra-suite-migas")).toContainText("Mercado");
  await expect(page.getByTestId("shell-crumb")).toHaveCount(0);
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
  await page.keyboard.type("ope");
  await expect(side.getByTestId("center-operaciones")).toBeVisible();
  await expect(side.getByTestId("center-clientes")).toHaveCount(0);
});

test("con el rol broker_supervisor la Bandeja del broker aparece en «Hoy»; el selector Broker no la concede", async ({ page }) => {
  await sesion(page, 200, [BROKER_ROLE]);
  await page.goto("/realtor/demand-radar");
  const side = page.getByTestId("shell-sidebar");
  await expect(side).toBeVisible({ timeout: 30_000 });
  const hoy = REALTOR_MENU[0].items.map((i) => i.label);
  expect(hoy).toContain("Bandeja del broker");
  await expect(side.getByTestId("center-bandeja-broker")).toBeVisible();
  await expect(side.getByTestId("center-bandeja-broker")).toContainText("Pronto");
});

test("negativo: sin el rol no hay Bandeja aunque se elija la vista Broker", async ({ page }) => {
  await sesion(page, 200, ["agent"]);
  await page.goto("/realtor/demand-radar");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("view-broker").click();
  await expect(page.getByTestId("view-broker")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("center-bandeja-broker")).toHaveCount(0);
});

test("tenant ajeno: la petición a /acceso no lleva tenant del cliente", async ({ page }) => {
  const vistas: string[] = [];
  await sesion(page, 200, [BROKER_ROLE], vistas);
  await page.goto("/realtor/demand-radar");
  await expect(page.getByTestId("shell-sidebar")).toBeVisible({ timeout: 30_000 });
  expect(vistas.length).toBeGreaterThan(0);
  for (const v of vistas) expect(v).not.toMatch(/tenant/i);
});

test("Resultados: centro vivo con DEMO rotulado", async ({ page }) => {
  await sesion(page, 200);
  await page.goto("/realtor/resultados");
  await expect(page.getByTestId("resultados-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("demo-banner")).toContainText("DEMO · datos sintéticos");
  await expect(page.getByTestId("funnel-cierres")).toBeVisible();
  await expect(page.getByTestId("center-resultados")).toHaveAttribute("data-center-state", "live");
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

// ROP-UX-NAV-MOVIL: por debajo de 768 px la barra de centros es un cajón; a 768 px sigue la barra fija.
test("a 390 px: sin barra fija, el panel ocupa el ancho, sin scroll horizontal, y el cajón abre y cierra", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sesion(page, 200, [BROKER_ROLE]);
  await page.goto("/realtor/demand-radar");
  const boton = page.getByRole("button", { name: "Menú de centros" });
  await expect(boton).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("shell-sidebar")).toHaveCount(0);
  await expect(page.getByTestId("demand-radar-panel")).toBeVisible();
  const ancho = await page.evaluate(() => ({
    vista: document.documentElement.clientWidth,
    pagina: document.documentElement.scrollWidth,
    main: document.querySelector("main#contenido")!.getBoundingClientRect().width,
    panel: document.querySelector('[data-testid="demand-radar-panel"]')!.getBoundingClientRect().width,
  }));
  expect(ancho.pagina).toBeLessThanOrEqual(ancho.vista);
  expect(ancho.main).toBeGreaterThanOrEqual(ancho.vista - 1);
  expect(ancho.panel).toBeGreaterThanOrEqual(ancho.vista - 48);

  await boton.click();
  const cajon = page.getByRole("dialog", { name: "Menú de centros" });
  await expect(cajon).toBeVisible();
  await expect(cajon.getByTestId("shell-sidebar")).toBeVisible();
  await expect(cajon.getByTestId("center-bandeja-broker")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cajon).toHaveCount(0);
  await expect(boton).toBeFocused();
});

test("a 768 px sigue la barra fija de 288 px y no hay botón de cajón", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await sesion(page, 200);
  await page.goto("/realtor/demand-radar");
  const side = page.getByTestId("shell-sidebar");
  await expect(side).toBeVisible({ timeout: 30_000 });
  expect((await side.boundingBox())!.width).toBe(288);
  await expect(page.getByRole("button", { name: "Menú de centros" })).toHaveCount(0);
});
