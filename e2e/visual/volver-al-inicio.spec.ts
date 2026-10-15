import { test, expect, type Page } from "@playwright/test";

/**
 * Desde cada core se vuelve al Inicio con un clic, y Atrás vuelve a la pantalla anterior (César, 2026-10-13).
 * Mismo arranque que fondo-continuo.spec.ts: backend simulado y sesión de superadmin de plataforma, que abre
 * todas las carcasas. Por core: se entra en la pantalla, un clic en «Inicio» lleva a "/", el botón Atrás de la
 * barra vuelve a la pantalla del core, Adelante otra vez a "/", y el Atrás del navegador también funciona.
 * El logotipo de arriba a la izquierda también lleva a "/".
 */
const B = process.env.VISUAL_BACKEND ?? "http://backend.invalid";
const CORES = [
  "/credit-hub/bank-v2",
  "/credit-hub/bank-v2/solicitudes",
  "/credit-hub/bank",
  "/credit-hub/dealer",
  "/autos/dealer",
  "/realtor",
  "/contable",
  "/sic",
  "/marketing-hub",
  // Módulos ya migrados al armazón común (ModuleShell, PR 6a): mismo recorrido Inicio / Atrás / Adelante.
  "/marketing/campaigns",
  "/legal",
  "/admin",
];
const MIGRADOS = [
  { ruta: "/marketing/campaigns", modulo: "marketing", menu: "Menú de Marketing" },
  { ruta: "/legal", modulo: "legal", menu: "Menú de Legal" },
  { ruta: "/admin", modulo: "administracion", menu: "Menú de Administración" },
];

async function sesion(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  // Credit Hub lee locale, moneda y zona horaria del branding del tenant: con `{}` su layout falla (locale.split).
  const branding = { display_name: "QA", locale: "es-DO", currency: "DOP", timezone: "America/Santo_Domingo", primary_color: "#2F4A6B" };
  await page.route("**/branding**", (route) => route.fulfill({ json: branding }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "qa", display_name: "QA", subscribed_cores: ["credit", "autos", "real_estate", "accounting", "marketing", "sic"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant],
      active_roles: [{ core_name: "platform", role_key: "platform_superadmin", display_name: "Superadmin" }],
    } }));
  await page.addInitScript(() => {
    localStorage.setItem("nadakki_refresh_token_v2", "r");
    localStorage.setItem("nadakki_tenant_id", "t1");     // el guard de Credit Hub (CHTenantGuard) exige un tenant
  });
}

const ruta = (page: Page) => new URL(page.url()).pathname;

for (const core of CORES) {
  test(`desde ${core}: Inicio con un clic y Atrás vuelve`, async ({ page }) => {
    await sesion(page);
    await page.goto(core);
    const barra = page.getByTestId("barra-suite");
    await expect(barra).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2500);                 // deja que terminen las redirecciones del propio core
    const enCore = ruta(page);                       // la del core (o la que su redirección decida)
    expect(enCore).not.toBe("/");

    // la barra está arriba a la izquierda y no la tapa la carcasa del core
    const caja = (await barra.boundingBox())!;
    expect(caja.y).toBe(0);
    const logo = (await page.getByTestId("barra-suite-logo").boundingBox())!;
    expect(logo.x).toBeLessThan(40);
    await expect(page.getByTestId("barra-suite-inicio")).toBeVisible();
    await expect(page.getByTestId("barra-suite-migas").getByRole("link").first()).toHaveAttribute("href", "/");

    await page.getByTestId("barra-suite-inicio").click();
    await expect.poll(() => ruta(page)).toBe("/");

    await page.getByTestId("barra-suite-atras").click();
    await expect.poll(() => ruta(page)).toBe(enCore);
    await expect(page.getByTestId("barra-suite")).toBeVisible();

    await page.getByTestId("barra-suite-adelante").click();
    await expect.poll(() => ruta(page)).toBe("/");

    await page.goBack();                              // el Atrás del navegador
    await expect.poll(() => ruta(page)).toBe(enCore);
    await page.waitForTimeout(1500);                  // sin redirección en bucle: sigue en el core
    expect(ruta(page)).toBe(enCore);

    await page.getByTestId("barra-suite-logo").click();
    await expect.poll(() => ruta(page)).toBe("/");
  });
}

/**
 * Móvil: la barra de la Suite (40 px, z-60) no tapa la cabecera del cajón lateral de ningún core. Los cajones eran
 * `fixed inset-y-0` y empezaban en el borde superior, bajo la barra nueva. Se abre el menú en cada carcasa y se mide:
 * el cajón empieza justo debajo de la barra y el punto de su esquina superior pertenece al cajón (no a la barra).
 */
const MOVIL = [
  { ruta: "/", boton: "Abrir el menú" },
  { ruta: "/autos/dealer", boton: "Abrir menú" },
  // bank-v2 no está aquí: con la sesión simulada (todas las APIs devuelven {}) su contenido cae al «Algo salió mal»
  // del módulo también en escritorio y no pinta el menú. Su cajón (DccShellSidebar) lo cubre la comprobación
  // estática de tests/nav/barra-suite.test.tsx; no se ha medido en navegador.
];
for (const m of MOVIL) {
  test(`móvil ${m.ruta}: el cajón del menú queda bajo la barra de la Suite`, async ({ page }) => {
    await sesion(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(m.ruta);
    await expect(page.getByTestId("barra-suite")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    await page.getByRole("button", { name: m.boton }).first().click();
    await page.waitForTimeout(600);                  // fin de la transición del cajón
    const medida = await page.evaluate(() => {
      const barra = document.querySelector('[data-testid="barra-suite"]')!.getBoundingClientRect();
      const cajones = Array.from(document.querySelectorAll("aside")).map((a) => ({ a, r: a.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.left >= 0 && r.left < window.innerWidth - 40 && r.height > 200);
      return {
        barraBajo: barra.bottom,
        cajones: cajones.map(({ a, r }) => ({
          top: r.top,
          items: a.querySelectorAll("a[href]").length,
          tapado: !a.contains(document.elementFromPoint(r.left + 20, r.top + 6)),
        })),
      };
    });
    console.info("MOBILE_MENU_MEASURE", m.ruta, JSON.stringify(medida));
    expect(medida.cajones.length).toBeGreaterThan(0);
    for (const c of medida.cajones) {
      expect(c.items).toBeGreaterThan(0);
      expect(c.top).toBeGreaterThanOrEqual(medida.barraBajo - 1);
      expect(c.tapado).toBe(false);
    }
  });
}

// Armazón común: barra con selector de módulos + menú lateral propio del módulo, y el selector lleva a otro módulo.
for (const m of MIGRADOS) {
  test(`${m.ruta}: ModuleShell con menú propio, selector de módulos y un solo desplegable`, async ({ page }) => {
    await sesion(page);
    await page.goto(m.ruta);
    await expect(page.getByTestId("barra-suite")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("module-shell")).toHaveAttribute("data-modulo", m.modulo);
    const menu = page.getByRole("complementary", { name: m.menu });
    await expect(menu).toBeVisible();
    expect(await menu.getByRole("link").count()).toBeGreaterThan(2);
    await expect(menu.locator('a[aria-current="page"]')).toHaveCount(1);
    // la barra y el menú no se tapan: el menú arranca justo debajo de la barra
    const barra = (await page.getByTestId("barra-suite").boundingBox())!;
    const lateral = (await menu.boundingBox())!;
    expect(Math.round(lateral.y)).toBe(Math.round(barra.y + barra.height));
    await expect(page.getByTestId("hueco-contexto")).toHaveCount(1);          // superadmin: el hueco existe y está vacío
    await expect(page.getByTestId("hueco-contexto")).toBeEmpty();

    await page.getByRole("button", { name: /Módulos/ }).click();
    const lista = page.getByTestId("selector-modulos-lista");
    await expect(lista).toBeVisible();
    expect(await lista.getByRole("link").count()).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Escape");
    await expect(lista).toHaveCount(0);

    await page.getByRole("button", { name: /Módulos/ }).click();
    await lista.getByRole("link", { name: "Legal" }).click();
    await expect.poll(() => ruta(page)).toBe("/legal");
    await expect(page.getByTestId("module-shell")).toHaveAttribute("data-modulo", "legal");
  });
}

test("la portada «/» es la Suite: su menú sirve para elegir módulo", async ({ page }) => {
  await sesion(page);
  await page.goto("/");
  await expect(page.getByTestId("module-shell")).toHaveAttribute("data-modulo", "suite", { timeout: 30_000 });
  const elegir = page.getByTestId("menu-grupo-suite-modulos");
  expect(await elegir.getByRole("link").count()).toBeGreaterThanOrEqual(3);
  await elegir.getByRole("link", { name: "Legal" }).click();
  await expect.poll(() => ruta(page)).toBe("/legal");
});
