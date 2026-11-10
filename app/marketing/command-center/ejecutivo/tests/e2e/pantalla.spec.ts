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
    // Tema OSCURO (azul noche) por defecto: la raiz lo declara y el fondo renderizado es el del diseno (#0A101C).
    await expect(page.getByTestId("command-center-ejecutivo")).toHaveAttribute("data-theme", "dark");
    expect(await page.getByTestId("command-center-ejecutivo").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(10, 16, 28)");
    await sinDesborde(page, vp.viewport);
    if (vp.movil) {
      await expect(page.getByRole("tablist")).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);
      // Tarjetas KPI apiladas: una sola columna de los tres indicadores principales en 320; el CPA va primero.
      const tops = await page.evaluate(() => {
        const top = (sel: string) => document.querySelector(sel)?.getBoundingClientRect().top ?? Number.NaN;
        return { cpa: top("[data-testid=kpi-cpa]"), inversion: top('[role=group][aria-label="Inversión"]'), leads: top('[role=group][aria-label="Leads atribuidos"]') };
      });
      // El CPA (la lectura) va primero; Inversion y Leads van lado a lado debajo (misma altura).
      expect(tops.cpa).toBeLessThan(tops.inversion);
      expect(tops.inversion).toBeLessThanOrEqual(tops.leads + 1);
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


// ---------------------------------------------------------------------------------------------------------------------------
// CRITERIO 1 (jerarquia ejecutiva): el primer viewport de ESCRITORIO, SIN scroll, muestra los tres KPI dominantes, el estado
// preliminar de rendimiento (chip del CPA + semaforo) y el inicio del grafico principal.
// ---------------------------------------------------------------------------------------------------------------------------
for (const vp of VPS.filter((v) => !v.movil)) {
  test(`criterio 1 · jerarquia ejecutiva a ${vp.viewport}: tres KPI, estado preliminar y grafico principal sin scroll`, async ({ page }, testInfo) => {
    await abrir(page, `ok-escritorio-${vp.viewport}.html`, vp);
    const caja = async (loc: import("@playwright/test").Locator) => {
      const b = await loc.first().boundingBox();
      expect(b, "elemento sin caja").not.toBeNull();
      return b as { x: number; y: number; width: number; height: number };
    };
    const dentro = (nombre: string, b: { y: number; height: number }) => {
      expect(b.y, `${nombre}: empieza dentro del viewport`).toBeGreaterThanOrEqual(0);
      expect(b.y + b.height, `${nombre}: termina dentro del viewport (${vp.height}px)`).toBeLessThanOrEqual(vp.height);
    };
    const medidas: Record<string, { top: number; bottom: number }> = {};
    for (const [nombre, loc] of [
      ["KPI Inversión", page.getByRole("group", { name: "Inversión" })],
      ["KPI CPA", page.getByTestId("kpi-cpa")],
      ["KPI Leads", page.getByRole("group", { name: "Leads atribuidos" })],
      ["Estado preliminar (chip del CPA)", page.getByTestId("cpa-lectura")],
      ["Lectura CPA vs objetivo", page.getByTestId("cpa-vs-objetivo")],
      ["Rentabilidad sin confirmar / CRM", page.getByTestId("cpa-rentabilidad")],
      ["Semáforo: lectura", page.getByTestId("semaforo-lectura")],
      ["Semáforo: barra", page.getByTestId("semaforo-barra")],
    ] as const) {
      const b = await caja(loc);
      dentro(nombre, b);
      medidas[nombre] = { top: Math.round(b.y), bottom: Math.round(b.y + b.height) };
    }
    await expect(page.getByTestId("cpa-lectura")).toHaveText(/Rendimiento preliminar/i);
    // Los tres KPI en la misma fila (misma banda horizontal), de izquierda a derecha: Inversion, CPA, Leads.
    const [a, b, c] = [await caja(page.getByRole("group", { name: "Inversión" })), await caja(page.getByTestId("kpi-cpa")), await caja(page.getByRole("group", { name: "Leads atribuidos" }))];
    expect(a.x).toBeLessThan(b.x);
    expect(b.x).toBeLessThan(c.x);
    expect(Math.abs(a.y - c.y)).toBeLessThan(2);
    // Inicio del grafico principal: el titulo entero y buena parte del trazado caen dentro del primer viewport.
    const titulo = await caja(page.getByText("Inversión diaria · 30 días").first());
    dentro("Grafico principal: titulo", titulo);
    const svg = await caja(page.locator('svg[role="img"][aria-label^="Serie temporal"]'));
    const visible = Math.min(svg.y + svg.height, vp.height) - svg.y;
    medidas["Grafico principal: svg"] = { top: Math.round(svg.y), bottom: Math.round(svg.y + svg.height) };
    expect(svg.y, "el trazado empieza dentro del viewport").toBeLessThan(vp.height - 150);
    expect(visible / svg.height, "al menos la mitad del trazado se ve sin scroll").toBeGreaterThanOrEqual(0.5);
    // Los indicadores secundarios (un bloque informativo mas) ya NO se interponen entre los KPI y el grafico.
    const sec = await caja(page.getByRole("region", { name: "Indicadores secundarios" }));
    expect(sec.y, "los secundarios van despues del grafico").toBeGreaterThan(svg.y);
    console.log(`JERARQUIA ${vp.viewport} ${JSON.stringify({ viewport: vp.height, visibleDelGrafico: `${Math.round((visible / svg.height) * 100)}%`, medidas })}`);
    await page.screenshot({ path: testInfo.outputPath(`primer-viewport-${vp.viewport}.png`), animations: "disabled" });
    const hash = createHash("sha256").update(readFileSync(testInfo.outputPath(`primer-viewport-${vp.viewport}.png`))).digest("hex");
    console.log(`CAPTURA primer-viewport-${vp.viewport} sha256:${hash}`);
  });
}

// ---------------------------------------------------------------------------------------------------------------------------
// CRITERIO 4 (movil): lo esencial primero; los detalles secundarios se expanden (con raton o con teclado).
// ---------------------------------------------------------------------------------------------------------------------------
for (const vp of VPS.filter((v) => v.movil)) {
  test(`criterio 4 · movil ${vp.viewport}: el CPA con su semaforo va primero, el detalle esta plegado y se expande con teclado`, async ({ page }, testInfo) => {
    const errores = await abrir(page, `ok-movil-resumen-${vp.viewport}.html`, vp);
    const y = async (loc: import("@playwright/test").Locator) => (await loc.first().boundingBox())?.y ?? Number.NaN;
    // Orden vertical: pestañas < CPA < barra del semaforo < supuestos < CRM < Inversion < Leads < grafico < detalles.
    const orden = [
      ["tablist", await y(page.getByRole("tablist"))],
      ["KPI CPA", await y(page.getByTestId("kpi-cpa"))],
      ["chip preliminar", await y(page.getByTestId("cpa-lectura"))],
      ["barra del semáforo", await y(page.getByTestId("semaforo-barra"))],
      ["supuestos", await y(page.getByTestId("resumen-supuestos"))],
      ["rentabilidad/CRM", await y(page.getByTestId("cpa-rentabilidad"))],
      ["KPI Inversión", await y(page.getByRole("group", { name: "Inversión" }))],
      ["KPI Leads", await y(page.getByRole("group", { name: "Leads atribuidos" }))],
      ["gráfico", await y(page.locator('svg[role="img"][aria-label^="Serie temporal"]'))],
      ["detalle secundarios", await y(page.getByTestId("detalle-secundarios"))],
      ["detalle supuestos", await y(page.getByTestId("detalle-supuestos"))],
    ] as const;
    console.log(`ORDEN_MOVIL ${vp.viewport} ${JSON.stringify(orden.map(([n, v]) => `${n}@${Math.round(v)}`))}`);
    for (let i = 1; i < orden.length; i++) expect(orden[i][1], `${orden[i][0]} va despues de ${orden[i - 1][0]}`).toBeGreaterThanOrEqual(orden[i - 1][1]);
    // Lo esencial (CPA, estado preliminar, supuestos, CRM) esta SIEMPRE visible sin expandir nada.
    for (const id of ["cpa-lectura", "cpa-vs-objetivo", "semaforo-barra", "resumen-supuestos", "cpa-rentabilidad"]) await expect(page.getByTestId(id)).toBeVisible();
    // En 390x844 toda la tarjeta del CPA cabe en el primer viewport; en 320x568 (pantalla minima) se mide cuanto se ve.
    const cpa = (await page.getByTestId("kpi-cpa").boundingBox()) as { y: number; height: number };
    console.log(`CPA_MOVIL ${vp.viewport} top=${Math.round(cpa.y)} bottom=${Math.round(cpa.y + cpa.height)} viewport=${vp.height}`);
    if (vp.height >= 800) expect(cpa.y + cpa.height, "la tarjeta del CPA completa cabe en el primer viewport").toBeLessThanOrEqual(vp.height);
    else expect(cpa.y, "el CPA empieza dentro del primer viewport").toBeLessThan(vp.height);
    // Detalles plegados por defecto: su contenido no se ve.
    for (const id of ["detalle-secundarios", "detalle-supuestos", "detalle-secciones"]) expect(await page.getByTestId(id).evaluate((d) => (d as HTMLDetailsElement).open), id).toBe(false);
    await expect(page.getByRole("region", { name: "Indicadores secundarios" })).toBeHidden();
    // Se abren con TECLADO: Tab hasta el resumen y Enter (los <details> nativos son accesibles).
    await page.getByTestId("detalle-secundarios").locator("summary").focus();
    await page.keyboard.press("Enter");
    expect(await page.getByTestId("detalle-secundarios").evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    await expect(page.getByRole("region", { name: "Indicadores secundarios" })).toBeVisible();
    await sinDesborde(page, `detalle expandido ${vp.viewport}`);
    await capturar(page, testInfo, `movil-secundarios-abiertos-${vp.viewport}`);
    expect(errores).toEqual([]);
  });

  test(`criterio 4 · movil ${vp.viewport}: filtros (periodo, comparar) y navegacion operables y sin desborde con todo expandido`, async ({ page }, testInfo) => {
    const errores = await abrir(page, `ok-movil-expandido-${vp.viewport}.html`, vp);
    await sinDesborde(page, `expandido ${vp.viewport}`);
    await expect(page.getByRole("radiogroup", { name: "Periodo" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "30 días" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("button", { name: /Comparar: periodo anterior/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tema oscuro/ })).toBeVisible();
    await expect(page.getByRole("tablist").getByRole("tab")).toHaveCount(3);
    await expect(page.getByTestId("semaforo")).toBeVisible();
    await capturar(page, testInfo, `movil-expandido-${vp.viewport}`);
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
  // 1) Orden del DOM = orden visual: primero la navegacion de secciones (los 4 controles inhabilitados, alcanzables para leer su motivo),
  //    despues el periodo (un solo radio activo por roving tabindex), «Comparar» y el tema, y luego el contenido.
  expect(nombres.slice(0, 4).join("|")).toMatch(/Campaign Intelligence.*Conversiones e ingresos.*Aprobaciones.*Modelo económico/);
  expect(nombres[4]).toMatch(/30 días/);
  expect(nombres[5]).toMatch(/Comparar: periodo anterior/);
  expect(nombres[6]).toMatch(/Tema oscuro/);
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
  const PAGINAS: Array<{ clave: string; html: string; vp: Pick<VP, "width" | "height"> }> = [
    ...VPS.map((v) => ({ clave: `oscuro ${v.viewport}`, html: v.movil ? `ok-movil-resumen-${v.viewport}.html` : `ok-escritorio-${v.viewport}.html`, vp: v })),
    ...(["390x844", "320x568"] as const).flatMap((m) => {
      const [w, h] = m.split("x").map(Number);
      return [
        { clave: `oscuro expandido ${m}`, html: `ok-movil-expandido-${m}.html`, vp: { width: w, height: h } },
        { clave: `oscuro campañas ${m}`, html: `ok-movil-campanas-${m}.html`, vp: { width: w, height: h } },
        { clave: `oscuro calidad ${m}`, html: `ok-movil-calidad-${m}.html`, vp: { width: w, height: h } },
      ];
    }),
    { clave: "oscuro estado desactualizado 1440x900", html: "estado-desactualizado-1440x900.html", vp: { width: 1440, height: 900 } },
    { clave: "claro (control) 1440x900", html: "claro-escritorio-1440x900.html", vp: { width: 1440, height: 900 } },
    { clave: "claro (control) 390x844", html: "claro-movil-resumen-390x844.html", vp: { width: 390, height: 844 } },
  ];
  for (const pg of PAGINAS) {
    await abrir(page, pg.html, pg.vp);
    resultados[pg.clave] = await page.evaluate(() => {
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
