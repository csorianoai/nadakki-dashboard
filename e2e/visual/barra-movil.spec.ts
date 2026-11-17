import { test, expect, type Page } from "@playwright/test";

/**
 * ROP-UX-NAV-MOVIL-BARRA: la barra COMÚN (BarraSuite + ModuleTopBar) cabe a 390, 768 y 1280 px en /realtor y en dos módulos
 * de ModuleShell (Marketing y Proyectos): ningún elemento visible de la barra sale del viewport, la página no tiene scroll
 * horizontal, las migas están centradas en la altura de la barra (con «Inicio») y en móvil el selector de tenant se alcanza
 * por «Más opciones de la barra». Mismo arranque simulado que volver-al-inicio.spec.ts, con un agente/administrador de
 * tenant (no superadmin) de «Soriano Realty». Necesita build (`next start`): job «visual».
 */
const B = process.env.VISUAL_BACKEND ?? "http://backend.invalid";
const ANCHOS = [390, 768, 1280];
const RUTAS = ["/realtor", "/marketing/campaigns", "/proyectos"];

async function sesion(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  const branding = { display_name: "Soriano Realty", locale: "es-DO", currency: "DOP", timezone: "America/Santo_Domingo", primary_color: "#2F4A6B" };
  await page.route("**/branding**", (route) => route.fulfill({ json: branding }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "soriano-realty", display_name: "Soriano Realty", subscribed_cores: ["real_estate", "legal", "marketing", "projects"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "cesar.soriano@sorianorealty.com", name: "César Soriano", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant],
      active_roles: [{ core_name: "platform", role_key: "tenant_admin", display_name: "Administrador" }],
    } }));
  await page.addInitScript(() => {
    localStorage.setItem("nadakki_refresh_token_v2", "r");
    localStorage.setItem("nadakki_tenant_id", "t1");
  });
}

for (const ancho of ANCHOS) {
  for (const ruta of RUTAS) {
    test(`${ruta} a ${ancho} px: la barra cabe, sin scroll horizontal y migas centradas`, async ({ page }) => {
      await sesion(page);
      await page.setViewportSize({ width: ancho, height: 844 });
      await page.goto(ruta);
      const barra = page.getByTestId("barra-suite");
      await expect(barra).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("barra-acciones")).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1500);

      // Cada control visible de la barra (botones, enlaces, migas, acciones) dentro del viewport, con su boundingBox.
      const elementos = barra.locator("a, button, ol, li, [data-testid]");
      const n = await elementos.count();
      for (let i = 0; i < n; i++) {
        const el = elementos.nth(i);
        if (!(await el.isVisible())) continue;
        const caja = await el.boundingBox();
        if (!caja || caja.width === 0) continue;
        const quien = (await el.getAttribute("data-testid")) ?? (await el.getAttribute("aria-label")) ?? `#${i}`;
        expect({ quien, izq: caja.x >= 0, der: caja.x + caja.width <= ancho + 0.5 }).toEqual({ quien, izq: true, der: true });
      }

      // Sin scroll horizontal en la página.
      const scroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(scroll.sw).toBeLessThanOrEqual(scroll.cw);

      // El usuario sigue alcanzable y entero.
      const usuario = (await page.getByTestId("barra-usuario").boundingBox())!;
      expect(usuario.x + usuario.width).toBeLessThanOrEqual(ancho);

      // Migas centradas en la altura de la barra, igual que «Inicio».
      const b = (await barra.boundingBox())!;
      const ultima = (await page.getByTestId("barra-suite-migas").getByRole("link").last().boundingBox())!;
      // Por debajo de sm «Inicio» se oculta y queda el logotipo (mismo destino): se centra contra el que se vea.
      const inicio = (await page.getByTestId(ancho >= 640 ? "barra-suite-inicio" : "barra-suite-logo").boundingBox())!;
      // La última miga se lee: al menos 40 px VISIBLES, recortando su caja con la de la lista (que tiene overflow-hidden).
      // Medido: a 390 px se quedaba en 2 px en Marketing y Proyectos, y a 768 px en 8 px (la caja del enlace era más ancha).
      const lista = (await page.getByTestId("barra-suite-migas").boundingBox())!;
      const visible = Math.min(ultima.x + ultima.width, lista.x + lista.width) - Math.max(ultima.x, lista.x);
      expect(visible, `última miga visible a ${ancho} px`).toBeGreaterThanOrEqual(40);
      const centro = (c: { y: number; height: number }) => c.y + c.height / 2;
      // Se centra el TEXTO de la miga (su Range), no la caja del enlace: con el mínimo global de 44 px la caja medía 44 px en
      // una barra de 40 y quedaba «centrada» mientras el texto iba pegado arriba (medido: texto en y=9, barra en y=20).
      const texto = await page.getByTestId("barra-suite-migas").getByRole("link").last().evaluate((a) => {
        const r = document.createRange();
        r.selectNodeContents(a);
        const t = r.getBoundingClientRect();
        return { y: t.top, height: t.height };
      });
      expect(Math.abs(centro(texto) - centro(b)), `texto de la miga a ${ancho} px`).toBeLessThanOrEqual(2);
      expect(Math.abs(centro(texto) - centro(inicio)), `texto de la miga frente al logotipo/Inicio a ${ancho} px`).toBeLessThanOrEqual(2);

      // Atrás y Adelante desde md (768); a 390 no caben con los objetivos táctiles de 44 px (app/globals.css).
      for (const id of ["barra-suite-atras", "barra-suite-adelante"]) {
        if (ancho >= 768) await expect(page.getByTestId(id)).toBeVisible();
        else await expect(page.getByTestId(id)).toBeHidden();
      }

      const mas = page.getByRole("button", { name: "Más opciones de la barra" });
      if (ancho < 1024) {
        // Por debajo de lg: el selector de tenant se alcanza por «Más» y su panel no sale del viewport.
        await mas.click();
        const panel = page.getByTestId("barra-mas-panel");
        await expect(panel).toBeVisible();
        await expect(panel).toContainText("Soriano Realty");
        if (ancho < 768) await expect(panel.getByRole("link", { name: "Notificaciones" })).toBeVisible();
        const p = (await panel.boundingBox())!;
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x + p.width).toBeLessThanOrEqual(ancho + 0.5);
      } else {
        await expect(mas).toBeHidden();
        await expect(page.getByTestId("barra-acciones").getByText("Soriano Realty")).toBeVisible();
      }
    });
  }
}
