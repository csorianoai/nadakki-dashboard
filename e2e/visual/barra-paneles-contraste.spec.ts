import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * ROP-UX-F3-FIX: contraste CALCULADO por el navegador de los paneles de la barra común (selector de tenant, menú de usuario y
 * Ctrl K) en /realtor/mi-dia (contenido claro detrás) y /marketing/campaigns (contenido oscuro). Cada panel debe tener fondo
 * PROPIO opaco (no heredar lo que haya detrás) y cada texto ≥4.5:1 contra el fondo opaco más cercano dentro del panel. Además Esc
 * cierra tenant y usuario. Mismo arranque simulado que barra-movil.spec.ts. Necesita build (`next start`): job «visual».
 */
const B = process.env.VISUAL_BACKEND ?? "http://backend.invalid";
const RUTAS = ["/realtor/mi-dia", "/marketing/campaigns"];

async function sesion(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "soriano-realty", display_name: "Soriano Realty", subscribed_cores: ["real_estate", "marketing"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "cesar.soriano@sorianorealty.com", name: "César Soriano", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant],
      active_roles: [{ core_name: "platform", role_key: "tenant_admin", display_name: "Administrador" }],
    } }));
  await page.route(/\/api\/v1\/realestate\/acceso/, (route) =>
    route.fulfill({ json: { allowed: true, tenant_id: "t1", roles: ["agent"], demo: false, qa_reviewer: false } }));
  await page.addInitScript(() => {
    localStorage.setItem("nadakki_refresh_token_v2", "r");
    localStorage.setItem("nadakki_tenant_id", "t1");
  });
}

/** Fondo propio del panel (alfa) y el peor contraste de sus textos contra el fondo opaco más cercano DENTRO del panel. */
async function medir(panel: Locator) {
  return panel.evaluate((raiz) => {
    const canales = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const lum = (c: string) => {
      const [r, g, b] = canales(c).map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const alfa = (c: string) => canales(c)[3] ?? 1;
    const fondo = (el: Element): string | null => {
      for (let e: Element | null = el; e; e = e.parentElement) {
        const b = getComputedStyle(e).backgroundColor;
        if (alfa(b) >= 0.99) return b;
        if (e === raiz) return null;
      }
      return null;
    };
    let peor = { texto: "", color: "", fondo: "", ratio: Infinity };
    for (const el of [raiz, ...raiz.querySelectorAll("*")]) {
      const t = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent!.trim()).map((n) => n.textContent!.trim()).join(" ");
      if (!t || (el as HTMLElement).offsetParent === null) continue;
      const c = getComputedStyle(el).color;
      const f = fondo(el) ?? "transparente";
      const r = f === "transparente" ? 0 : (Math.max(lum(c), lum(f)) + 0.05) / (Math.min(lum(c), lum(f)) + 0.05);
      if (r < peor.ratio) peor = { texto: t.slice(0, 40), color: c, fondo: f, ratio: Math.round(r * 100) / 100 };
    }
    return { fondoPropio: getComputedStyle(raiz).backgroundColor, alfaPropio: alfa(getComputedStyle(raiz).backgroundColor), peor };
  });
}

async function abrirRuta(page: Page, ruta: string) {
  await sesion(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(ruta);
  await expect(page.getByTestId("barra-acciones").first()).toBeVisible({ timeout: 30_000 });
}

for (const ruta of RUTAS) {
  test(`${ruta}: selector de tenant con fondo propio opaco, texto ≥4.5:1 y Esc lo cierra`, async ({ page }) => {
    await abrirRuta(page, ruta);
    const boton = page.getByRole("button", { name: /Tenant:/ });
    await boton.click();
    const panel = page.locator("div.absolute", { has: page.getByText("Tenant activo", { exact: true }) });
    const m = await medir(panel);
    expect(m.alfaPropio, JSON.stringify(m)).toBeGreaterThanOrEqual(0.99);
    expect(m.peor.ratio, JSON.stringify(m.peor)).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(boton).toBeFocused();
  });

  test(`${ruta}: menú de usuario con fondo propio opaco, texto ≥4.5:1 y Esc lo cierra`, async ({ page }) => {
    await abrirRuta(page, ruta);
    const boton = page.getByRole("button", { name: "User menu" });
    await boton.click();
    const panel = page.locator("div.absolute", { has: page.getByRole("button", { name: "Cerrar sesion" }) });
    const m = await medir(panel);
    expect(m.alfaPropio, JSON.stringify(m)).toBeGreaterThanOrEqual(0.99);
    expect(m.peor.ratio, JSON.stringify(m.peor)).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(boton).toBeFocused();
  });

  test(`${ruta}: Ctrl K con fondo propio opaco y texto ≥4.5:1`, async ({ page }) => {
    await abrirRuta(page, ruta);
    await page.getByTestId("barra-buscar").click();
    const panel = page.getByRole("dialog").locator("> div").first();
    const m = await medir(panel);
    expect(m.alfaPropio, JSON.stringify(m)).toBeGreaterThanOrEqual(0.99);
    expect(m.peor.ratio, JSON.stringify(m.peor)).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}
