import { test, expect, type Page } from "@playwright/test";

/**
 * Fondo oscuro continuo y texto legible en las pantallas principales (portada, Admin, Social).
 *
 * Defecto medido el 2026-10-12: dentro del GlobalForgeAppShell, `main` es `flex flex-col overflow-y-auto`
 * (#124). `.ndk-page` era un elemento flex que encogía (flex-shrink: 1) y su `min-h-[80vh]` anulaba el
 * `min-height: auto` que lo impedía: a 1440×900 el bloque oscuro medía 900 px con 1339 px de contenido y
 * las tarjetas «Acceso rápido por función» caían sobre el fondo claro del shell con texto blanco.
 *
 * La comprobación no compara píxel a píxel con una imagen (frágil entre versiones de Chromium y fuentes):
 * 1) el bloque `.ndk-page` es al menos tan alto como su contenido;
 * 2) en la captura de arriba y de abajo del scroll, los píxeles claros del área de contenido son < 2 %.
 * Las capturas quedan en test-results/ (artefacto del CI).
 */

const B = process.env.VISUAL_BACKEND ?? "http://backend.invalid";
const PANTALLAS = [
  { ruta: "/", espera: "Acceso rápido por función" },
  { ruta: "/admin", espera: null },
  { ruta: "/social", espera: null },
];
const MAX_CLAROS = 0.02;

async function sesion(page: Page) {
  // El último route registrado gana: primero el genérico, después los de sesión.
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "qa", display_name: "QA", subscribed_cores: ["credit", "legal", "marketing"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant],
      // Superadmin de plataforma: /admin solo lo abre personal de Nadakki (lib/auth/platform-staff.ts).
      active_roles: [{ core_name: "platform", role_key: "platform_superadmin", display_name: "Superadmin" }],
    } }));
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
}

/** Fracción de píxeles claros (luma > 200) en el área de contenido (a la derecha del menú, bajo la cabecera). */
async function fraccionClara(page: Page, png: Buffer): Promise<number> {
  const caja = await page.locator("main").first().boundingBox();
  return page.evaluate(async ({ b64, caja }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(caja.x, caja.y, caja.width, caja.height);
    let claros = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] > 200) claros++;
    }
    return claros / (data.length / 4);
  }, { b64: png.toString("base64"), caja: caja! });
}

for (const p of PANTALLAS) {
  test(`fondo continuo y texto legible: ${p.ruta}`, async ({ page }, info) => {
    await sesion(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(p.ruta);
    const bloque = page.locator(".ndk-page").first();
    await expect(bloque).toBeVisible({ timeout: 20_000 });
    if (p.espera) await expect(page.getByText(p.espera)).toBeVisible();
    await page.waitForTimeout(1000);

    const alto = await bloque.evaluate((el) => ({ caja: el.getBoundingClientRect().height, contenido: el.scrollHeight }));
    const arriba = await page.screenshot();
    await page.locator("main").first().evaluate((m) => { m.scrollTop = m.scrollHeight; });
    await page.waitForTimeout(300);
    const abajo = await page.screenshot();
    const nombre = p.ruta === "/" ? "portada" : p.ruta.slice(1).replace(/\//g, "-");
    await info.attach(`${nombre}-arriba`, { body: arriba, contentType: "image/png" });
    await info.attach(`${nombre}-abajo`, { body: abajo, contentType: "image/png" });

    const claros = { arriba: await fraccionClara(page, arriba), abajo: await fraccionClara(page, abajo) };
    console.log(`${p.ruta}: .ndk-page ${alto.caja}/${alto.contenido}px, claros arriba ${(claros.arriba * 100).toFixed(1)} % abajo ${(claros.abajo * 100).toFixed(1)} %`);
    expect.soft(alto.caja, `.ndk-page mide ${alto.caja}px con ${alto.contenido}px de contenido`)
      .toBeGreaterThanOrEqual(alto.contenido - 1);
    expect.soft(claros.arriba, "píxeles claros arriba").toBeLessThan(MAX_CLAROS);
    expect.soft(claros.abajo, "píxeles claros abajo").toBeLessThan(MAX_CLAROS);
  });
}
