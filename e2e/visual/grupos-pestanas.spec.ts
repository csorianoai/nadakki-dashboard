import { test, expect, type Page } from "@playwright/test";

/**
 * Pantalla del grupo (tarjetas) y pestañas del grupo (César, 2026-10-13, ajuste al punto 3 de la FASE 1: sin «Más»).
 * Mismo arranque que volver-al-inicio.spec.ts: backend simulado y sesión de superadmin con tenant en localStorage.
 * Recorrido en Marketing, grupo «Campañas» (11 páginas): entrar en el grupo muestra la cuadrícula; abrir una tarjeta
 * lleva a la página y muestra la barra con TODAS las pestañas, con la activa tomada de la URL; a 390x844 la barra se
 * desplaza y las tarjetas se apilan en una columna. Deja capturas en test-results/ (grupos-*.png).
 */
const B = process.env.VISUAL_BACKEND ?? "http://backend.invalid";
const GRUPO = "/marketing-hub/grupo/marketing-campanas";
const PAGINAS_CAMPANAS = [
  "Resumen de marketing", "Campañas", "Nueva campaña", "Recorridos del cliente", "Calendario", "Correo",
  "WhatsApp", "Flujos de trabajo", "Automatizaciones", "Piloto automático", "Marketing autónomo (AME)",
];

async function sesion(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
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
    localStorage.setItem("nadakki_tenant_id", "t1");
  });
}

const ruta = (page: Page) => new URL(page.url()).pathname;
const xs = async (page: Page, sel: string) => (await page.locator(sel).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x))));

test.describe("escritorio 1440x900", () => {
  test("grupo → cuadrícula de tarjetas → página con la barra de pestañas", async ({ page }) => {
    await sesion(page);
    await page.goto("/marketing-hub");
    await expect(page.getByTestId("module-shell")).toHaveAttribute("data-modulo", "marketing", { timeout: 30_000 });
    await page.waitForTimeout(1500);

    // el título del grupo en el menú lateral lleva a la pantalla del grupo
    await page.getByTestId("menu-grupo-enlace-marketing-campanas").click();
    await expect.poll(() => ruta(page)).toBe(GRUPO);
    const tarjetas = page.getByTestId("tarjeta-pagina");
    await expect(tarjetas).toHaveCount(PAGINAS_CAMPANAS.length);
    await expect(page.getByTestId("pestanas-grupo")).toHaveCount(0);       // la pantalla del grupo ya muestra todo
    for (const nombre of PAGINAS_CAMPANAS) await expect(tarjetas.filter({ hasText: nombre }).first()).toBeVisible();
    await expect(tarjetas.nth(4)).toContainText("Calendario");
    await expect(tarjetas.nth(4)).toContainText("Calendario mensual con las campañas programadas");  // la línea de qué hace
    // cuadrícula de varias columnas en escritorio
    expect(new Set(await xs(page, '[data-testid="tarjeta-pagina"]')).size).toBeGreaterThanOrEqual(3);
    // fondo oscuro como el resto del armazón (el título es claro: debe leerse)
    expect(await page.getByTestId("pantalla-grupo").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(9, 9, 11)");
    await expect(page.getByRole("heading", { level: 1, name: "Campañas" })).toBeVisible();
    await tarjetas.nth(2).hover();                                          // relieve sutil al pasar el ratón
    await page.waitForTimeout(250);
    await page.screenshot({ path: "test-results/grupos-escritorio-cuadricula.png" });

    // una tarjeta lleva a la página, con la barra de TODAS las pestañas y la activa tomada de la URL
    await tarjetas.nth(4).click();
    await expect.poll(() => ruta(page)).toBe("/marketing/calendar");
    const barra = page.getByTestId("pestanas-grupo");
    await expect(barra).toBeVisible();
    await expect(barra.getByTestId("pestana-grupo")).toHaveCount(PAGINAS_CAMPANAS.length);
    expect(await barra.getByTestId("pestana-grupo").allTextContents()).toEqual(PAGINAS_CAMPANAS);
    const activa = barra.locator('a[aria-current="page"]');
    await expect(activa).toHaveCount(1);
    await expect(activa).toHaveText("Calendario");
    await expect(activa).toHaveAttribute("href", ruta(page));
    await page.screenshot({ path: "test-results/grupos-escritorio-pestanas.png" });

    // cambiar de pestaña cambia la URL y la pestaña activa
    await barra.getByRole("link", { name: "WhatsApp" }).click();
    await expect.poll(() => ruta(page)).toBe("/marketing/whatsapp");
    await expect(barra.locator('a[aria-current="page"]')).toHaveText("WhatsApp");
    // PestanasMarketing ya no existe: una sola barra de pestañas
    await expect(page.getByTestId("pestanas-marketing")).toHaveCount(0);
    await expect(page.locator("nav[aria-label^='Páginas de']")).toHaveCount(1);
  });

  test("Legal (menú plano): sin pantalla de grupo, pestañas con todas las páginas y una sola barra", async ({ page }) => {
    await sesion(page);
    await page.goto("/legal/cases");
    const barra = page.getByTestId("pestanas-grupo");
    await expect(barra).toBeVisible({ timeout: 30_000 });
    await expect(barra.getByTestId("pestana-grupo")).toHaveCount(9);
    await expect(barra.locator('a[aria-current="page"]')).toHaveText("Expedientes");
    await expect(page.locator("nav[aria-label='Legal']")).toHaveCount(0);   // la barra propia anterior (LegalSubNav) ya no se pinta
    await expect(page.getByTestId("menu-modulo").locator("[data-testid^='menu-grupo-enlace-']")).toHaveCount(0);
  });
});

test.describe("móvil 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("las tarjetas se apilan en una columna y la barra de pestañas se desplaza", async ({ page }) => {
    await sesion(page);
    await page.goto(GRUPO);
    const tarjetas = page.getByTestId("tarjeta-pagina");
    await expect(tarjetas).toHaveCount(PAGINAS_CAMPANAS.length, { timeout: 30_000 });
    expect(new Set(await xs(page, '[data-testid="tarjeta-pagina"]')).size).toBe(1);   // una sola columna
    const caja = (await tarjetas.first().boundingBox())!;
    expect(caja.width).toBeGreaterThan(390 * 0.8);
    await page.screenshot({ path: "test-results/grupos-movil-cuadricula.png" });

    await tarjetas.nth(4).click();
    await expect.poll(() => ruta(page)).toBe("/marketing/calendar");
    const lista = page.getByTestId("pestanas-lista");
    await expect(lista).toBeVisible();
    await expect(page.getByTestId("pestana-grupo")).toHaveCount(PAGINAS_CAMPANAS.length);
    const medidas = await lista.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    expect(medidas.sw).toBeGreaterThan(medidas.cw);
    // el scroll-snap y el desplazamiento táctil: la lista se mueve y la pestaña activa quedó a la vista
    expect(await lista.evaluate((e) => getComputedStyle(e).scrollSnapType)).toContain("x");
    expect(await lista.evaluate((e) => getComputedStyle(e).overflowX)).toBe("auto");
    const activa = page.locator('[data-testid="pestanas-grupo"] a[aria-current="page"]');
    await expect(activa).toBeInViewport();
    expect(await lista.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);              // se centró la activa (Calendario)
    // las flechas existen porque hay desbordamiento y desplazan la lista
    await expect(page.getByTestId("pestanas-flecha-der")).toBeVisible();
    const antes = await lista.evaluate((e) => e.scrollLeft);
    await page.getByTestId("pestanas-flecha-der").click();
    await expect.poll(() => lista.evaluate((e) => e.scrollLeft)).toBeGreaterThan(antes);
    await page.waitForTimeout(800);                                                    // termina el desplazamiento suave
    await lista.evaluate((e) => { e.scrollLeft = 0; });
    await expect.poll(() => lista.evaluate((e) => e.scrollLeft)).toBe(0);
    await lista.evaluate((e) => { e.scrollLeft = 150; });
    expect(await lista.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
    // la página no se desborda en horizontal por culpa de la barra
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: "test-results/grupos-movil-pestanas.png" });
  });
});
