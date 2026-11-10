import { expect, test, type Page } from "@playwright/test";
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

const OUT = process.env.OUT ?? "/tmp/cc-harness";

type VP = { viewport: string; width: number; height: number; movil: boolean };
const VPS: VP[] = [
  { viewport: "1920x1080", width: 1920, height: 1080, movil: false },
  { viewport: "1440x900", width: 1440, height: 900, movil: false },
  { viewport: "390x844", width: 390, height: 844, movil: true },
  { viewport: "320x568", width: 320, height: 568, movil: true },
];

test.skip(!existsSync(join(OUT, "ok-escritorio-1440x900.html")), `falta el harness (${OUT}); ejecuta app/marketing/command-center/ejecutivo/tests/build-harness.sh`);

async function abrir(page: Page, html: string, vp: Pick<VP, "width" | "height">) {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(String(e)));
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(pathToFileURL(join(OUT, html)).href);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  return errores;
}

async function capturar(page: Page, testInfo: import("@playwright/test").TestInfo, nombre: string) {
  const ruta = testInfo.outputPath(`${nombre}.png`);
  await page.screenshot({ path: ruta, fullPage: true, animations: "disabled" });
  const hash = createHash("sha256").update(readFileSync(ruta)).digest("hex");
  console.log(`CAPTURA ${nombre} sha256:${hash}`);
}

async function sinDesborde(page: Page, etiqueta: string) {
  const ancho = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(ancho.scroll, `desborde horizontal: ${etiqueta}`).toBeLessThanOrEqual(ancho.client);
  const fuera = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("section, li, [role=group], [role=tabpanel], table, nav, label, button, figure, svg, dl"))
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 0.5 || el.getBoundingClientRect().left < -0.5)
      .map((el) => `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""}`)
  );
  expect(fuera, `bloques fuera del viewport: ${etiqueta}`).toEqual([]);
  // Texto recortado por overflow:hidden en elementos con texto propio.
  const recortados = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,p,span,dt,dd,button,th,td,legend,label"))
      .filter((el) => {
        const cs = getComputedStyle(el);
        const oculto = cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.textOverflow === "ellipsis";
        return oculto && el.scrollWidth > el.clientWidth + 1 && !el.classList.contains("sr-only") && (el.textContent ?? "").trim().length > 0 && el.getBoundingClientRect().width > 4;
      })
      .map((el) => (el.textContent ?? "").trim().slice(0, 40))
  );
  expect(recortados, `textos cortados: ${etiqueta}`).toEqual([]);
}

for (const vp of VPS) {
  const html = vp.movil ? `ok-movil-resumen-${vp.viewport}.html` : `ok-escritorio-${vp.viewport}.html`;
  test(`ok a ${vp.viewport}: sin desbordes ni errores, banner DEMO y estructura segun el ancho`, async ({ page }, testInfo) => {
    const errores = await abrir(page, html, vp);
    await expect(page.getByTestId("banner-demo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await sinDesborde(page, vp.viewport);
    if (vp.movil) {
      await expect(page.getByRole("tablist")).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);
      // Tarjetas KPI apiladas: una sola columna de los tres indicadores principales en 320; el CPA va primero.
      const tops = await page.evaluate(() => {
        const top = (sel: string) => document.querySelector(sel)?.getBoundingClientRect().top ?? Number.NaN;
        return { cpa: top("[data-testid=kpi-cpa]"), inversion: top('[role=group][aria-label="Inversión"]'), leads: top('[role=group][aria-label="Leads atribuidos"]') };
      });
      expect(tops.cpa).toBeLessThan(tops.inversion);
      expect(tops.inversion).toBeLessThan(tops.leads);
    } else {
      await expect(page.getByRole("tablist")).toHaveCount(0);
      await expect(page.getByRole("table", { name: "Campañas" })).toBeVisible();
      await expect(page.getByTestId("semaforo")).toBeVisible();
      await expect(page.getByTestId("tira-conversiones")).toBeVisible();
    }
    // Tamano de objetivo (WCAG 2.5.8, AA): minimo 24 px, o exento si un circulo de 24 px centrado en el no toca a otro objetivo.
    // Ademas se INFORMA todo objetivo < 44 px (meta de diseno tactil) sin bloquear: son componentes del kit/Forge fuera de esta zona.
    const objetivos = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("button, [role=radio], [role=tab], a[href], input, summary")).filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const rects = els.map((e) => e.getBoundingClientRect());
      const incumplen: string[] = [];
      const menores44: string[] = [];
      els.forEach((e, i) => {
        const r = rects[i];
        const nombre = `${(e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`;
        if (r.height < 43.5) menores44.push(nombre);
        if (r.width >= 23.5 && r.height >= 23.5) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const toca = rects.some((o, j) => {
          if (j === i) return false;
          const dx = Math.max(o.left - cx, 0, cx - o.right);
          const dy = Math.max(o.top - cy, 0, cy - o.bottom);
          return Math.hypot(dx, dy) < 12;
        });
        if (toca) incumplen.push(nombre);
      });
      return { incumplen, menores44 };
    });
    console.log(`OBJETIVOS_MENORES_44 ${vp.viewport} ${JSON.stringify(objetivos.menores44)}`);
    expect(objetivos.incumplen, "objetivos < 24 px sin exencion por espaciado (WCAG 2.5.8)").toEqual([]);
    await capturar(page, testInfo, `ok-${vp.movil ? "movil-resumen" : "escritorio"}-${vp.viewport}`);
    expect(errores).toEqual([]);
  });
}

for (const vp of VPS.filter((v) => v.movil)) {
  for (const pestana of ["campanas", "calidad"] as const) {
    test(`movil ${vp.viewport}: pestaña ${pestana} sin desbordes`, async ({ page }, testInfo) => {
      const errores = await abrir(page, `ok-movil-${pestana}-${vp.viewport}.html`, vp);
      await sinDesborde(page, `${pestana} ${vp.viewport}`);
      if (pestana === "campanas") await expect(page.getByRole("list", { name: "Campañas" })).toBeVisible();
      await capturar(page, testInfo, `ok-movil-${pestana}-${vp.viewport}`);
      expect(errores).toEqual([]);
    });
  }
}

for (const vp of [VPS[1], VPS[2]]) {
  for (const [estado, selector] of [
    ["vacio", "[data-estado=vacio]"],
    ["error", "[role=alert]"],
    ["cargando", "[data-estado=cargando]"],
    ["desactualizado", "[data-testid=aviso-desactualizado]"],
  ] as const) {
    test(`estado ${estado} a ${vp.viewport}: visible, sin desbordes`, async ({ page }, testInfo) => {
      const errores = await abrir(page, `estado-${estado}-${vp.viewport}.html`, vp);
      await expect(page.locator(selector).first()).toBeVisible();
      await expect(page.getByTestId("banner-demo")).toBeVisible();
      await sinDesborde(page, `estado ${estado} ${vp.viewport}`);
      await capturar(page, testInfo, `estado-${estado}-${vp.viewport}`);
      expect(errores).toEqual([]);
    });
  }
}

test("teclado real: orden de Tab logico, anillo de foco visible en cada parada y sin trampas", async ({ page }) => {
  const errores = await abrir(page, "ok-escritorio-1440x900.html", { width: 1440, height: 900 });
  const paradas: Array<{ nombre: string; estilo: string; ancho: number }> = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const nombre = el.getAttribute("aria-label") || (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 50) || el.tagName;
      return { nombre, estilo: cs.outlineStyle, ancho: parseFloat(cs.outlineWidth) };
    });
    if (!info) break;
    paradas.push(info);
  }
  const nombres = paradas.map((p) => p.nombre);
  console.log("ORDEN_TAB " + JSON.stringify(nombres));
  // 1) Primero el periodo (un solo radio activo por roving tabindex), luego «Comparar», luego la navegacion de secciones.
  expect(nombres[0]).toMatch(/30 días/);
  expect(nombres[1]).toMatch(/Comparar: periodo anterior/);
  expect(nombres.slice(2, 6).join("|")).toMatch(/Campaign Intelligence.*Conversiones e ingresos.*Aprobaciones.*Modelo económico/);
  // 2) Toda parada de foco muestra un anillo visible.
  const sinAnillo = paradas.filter((p) => p.estilo === "none" || !(p.ancho > 0)).map((p) => p.nombre);
  expect(sinAnillo, "paradas de foco sin anillo visible").toEqual([]);
  // 3) Sin trampa: se sale del documento recorriendo con Tab y se vuelve con Shift+Tab.
  expect(paradas.length).toBeGreaterThan(8);
  expect(paradas.length).toBeLessThan(60);
  await page.keyboard.press("Shift+Tab");
  const vuelve = await page.evaluate(() => document.activeElement !== document.body);
  expect(vuelve).toBe(true);
  expect(errores).toEqual([]);
});

test("controles inhabilitados: alcanzables por teclado, anunciados como aria-disabled y con su motivo", async ({ page }) => {
  await abrir(page, "ok-escritorio-1440x900.html", { width: 1440, height: 900 });
  const apagados = await page.$$eval('[data-control="inhabilitado"]', (els) =>
    els.map((e) => ({ nombre: (e.textContent ?? "").trim(), disabled: e.getAttribute("aria-disabled"), motivo: document.getElementById(e.getAttribute("aria-describedby") ?? "")?.textContent ?? "" }))
  );
  expect(apagados.length).toBeGreaterThanOrEqual(6);
  for (const a of apagados) {
    expect(a.disabled, a.nombre).toBe("true");
    expect(a.motivo, a.nombre).toMatch(/^Disponible cuando /);
  }
});

test("contraste AA de los textos (4.5:1; 3:1 en texto grande) calculado sobre los colores reales renderizados", async ({ page }) => {
  const resultados: Record<string, Array<{ texto: string; ratio: number; fg: string; bg: string; inactivo: boolean; decorativo: boolean }>> = {};
  for (const vp of VPS) {
    const html = vp.movil ? `ok-movil-resumen-${vp.viewport}.html` : `ok-escritorio-${vp.viewport}.html`;
    await abrir(page, html, vp);
    resultados[vp.viewport] = await page.evaluate(() => {
      type RGBA = [number, number, number, number];
      const canvas = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
      // Normaliza cualquier color CSS (rgb, color(srgb…), color-mix) a RGBA usando el canvas.
      const aRGBA = (css: string): RGBA => {
        canvas.clearRect(0, 0, 1, 1);
        canvas.fillStyle = "#000";
        canvas.fillStyle = css;
        canvas.fillRect(0, 0, 1, 1);
        const d = canvas.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      };
      const sobre = (fg: RGBA, bg: [number, number, number]): [number, number, number] => [fg[0] * fg[3] + bg[0] * (1 - fg[3]), fg[1] * fg[3] + bg[1] * (1 - fg[3]), fg[2] * fg[3] + bg[2] * (1 - fg[3])];
      const lum = ([r, g, b]: [number, number, number]) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const fondo = (el: Element): [number, number, number] => {
        const pila: RGBA[] = [];
        for (let n: Element | null = el; n; n = n.parentElement) {
          const c = aRGBA(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) pila.push(c);
          if (c[3] >= 1) break;
        }
        let base: [number, number, number] = [255, 255, 255];
        for (const c of pila.reverse()) base = sobre(c, base);
        return base;
      };
      const out: Array<{ texto: string; ratio: number; fg: string; bg: string; inactivo: boolean; decorativo: boolean }> = [];
      const visto = new Set<string>();
      for (const el of Array.from(document.querySelectorAll<HTMLElement | SVGElement>("body *"))) {
        const propio = Array.from(el.childNodes).filter((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0);
        if (propio.length === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue; // sr-only
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const esSvg = el instanceof SVGElement;
        const fgCss = esSvg ? cs.fill : cs.color;
        let fg = aRGBA(fgCss);
        let op = 1;
        for (let n: Element | null = el; n; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity || "1");
        fg = [fg[0], fg[1], fg[2], fg[3] * op];
        const bg = fondo(el);
        const color = sobre(fg, bg);
        const l1 = lum(color);
        const l2 = lum(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const px = parseFloat(cs.fontSize);
        const peso = parseInt(cs.fontWeight, 10) || 400;
        const grande = px >= 24 || (px >= 18.66 && peso >= 700);
        const minimo = grande ? 3 : 4.5;
        const inactivo = !!el.closest('[aria-disabled="true"], :disabled');
        const texto = (propio[0].textContent ?? "").trim().slice(0, 40);
        const clave = `${texto}|${ratio.toFixed(2)}`;
        if (ratio < minimo && !visto.has(clave)) {
          visto.add(clave);
          out.push({ texto, ratio: Math.round(ratio * 100) / 100, fg: fgCss, bg: `rgb(${bg.map(Math.round).join(",")})`, inactivo, decorativo: !!el.closest('[aria-hidden="true"]') });
        }
      }
      return out;
    });
  }
  console.log("CONTRASTE " + JSON.stringify(resultados));
  // Los controles inactivos estan exentos por WCAG 1.4.3 y los glifos decorativos (aria-hidden) no son texto: se informan pero no bloquean.
  // Todo texto real y activo debe pasar AA.
  const fallos = Object.entries(resultados).flatMap(([vp, l]) => l.filter((x) => !x.inactivo && !x.decorativo).map((x) => `${vp}: «${x.texto}» ${x.ratio}:1`));
  expect(fallos).toEqual([]);
});
