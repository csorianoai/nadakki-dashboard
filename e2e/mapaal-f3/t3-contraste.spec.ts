/**
 * MF3-T3 — Contabilidad: Plan de cuentas, Libro mayor, Asientos y Balance legibles.
 *
 * Mide el contraste REAL (color calculado del texto contra el primer fondo opaco de sus ancestros) de todo texto
 * visible en las 4 pantallas, en tema claro y oscuro, y exige >= 4.5:1. Solo lectura.
 *
 * Hermetico: corre contra el servidor LOCAL (playwright.config.ts lo levanta en CI con backend `backend.invalid`).
 * La sesion y TODA llamada al backend se interceptan (context.route) con datos fijos del tenant QA; lo externo se
 * aborta y se anota. Un test comprueba que nada sale hacia api.nadakki.com ni queda sin fixture.
 *
 *   npx playwright test e2e/mapaal-f3/t3-contraste.spec.ts --reporter=line
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const TENANT = { id: "00000000-0000-4000-8000-0000000000a1", slug: "mapaal-qa", display_name: "Mapaal QA", subscribed_cores: ["contable"], is_demo: false };
const USER = { id: "u-qa", email: "qa@example.invalid", name: "QA", is_active: true, mfa_enabled: false };
const ROL = { core_name: "contable", role_key: "tenant_admin", display_name: "Administrador" };
const TOKEN = "e2e.fixture.token";
const TS = "2026-01-01T00:00:00Z";
const CUENTAS = [
  ["c1", "1000", "Activos", "activo", "deudora", null, 1],
  ["c2", "1010", "Caja", "activo", "deudora", "c1", 2],
  ["c3", "2000", "Pasivos", "pasivo", "acreedora", null, 1],
  ["c4", "4010", "Ingresos por ventas", "ingreso", "acreedora", null, 1],
].map(([id, codigo, nombre, tipo_cuenta, naturaleza, cuenta_padre_id, nivel]) => ({
  id, tenant_id: TENANT.id, codigo, nombre, tipo_cuenta, naturaleza, cuenta_padre_id, nivel, activa: true, created_at: TS, updated_at: TS,
}));
const PERIODOS = [1, 2].map((n) => ({
  id: `p${n}`, tenant_id: TENANT.id, fiscal_year: new Date().getFullYear(), period_number: n, status: "open",
  start_date: `${new Date().getFullYear()}-0${n}-01`, end_date: `${new Date().getFullYear()}-0${n}-28`,
}));
const MAYOR = {
  cuenta_id: "c2", cuenta_codigo: "1010", cuenta_nombre: "Caja", periodo_id: "p1", saldo_inicial: 1000, saldo_final: 1500,
  movimientos: [{ id: "m1", asiento_id: "a1", numero_asiento: "AS-0001", fecha: "2026-01-05", descripcion: "Venta al contado", debe_base: 500, haber_base: 0, saldo_acumulado: 1500 }],
};
const BALANCE = {
  periodo_id: "p1", fiscal_year: new Date().getFullYear(), label: "Periodo 1",
  rows: [
    { cuenta_id: "c2", codigo: "1010", nombre: "Caja", tipo_cuenta: "activo", total_debe: 1500, total_haber: 0, saldo: 1500 },
    { cuenta_id: "c4", codigo: "4010", nombre: "Ingresos por ventas", tipo_cuenta: "ingreso", total_debe: 0, total_haber: 1500, saldo: -1500 },
  ],
  totals: { total_debe: 1500, total_haber: 1500, cuadra: true },
};

/** Fixtures por ruta (sin el origen). Lo que no esta aqui se anota como "sin fixture" y responde 404. */
function fixtureDe(pathname: string, metodo: string): unknown | undefined {
  if (pathname === "/api/v2/auth/refresh") return { access_token: TOKEN, refresh_token: "rt-fixture", expires_in: 3600 };
  if (pathname === "/api/v2/auth/me")
    return { user: USER, current_tenant: TENANT, all_tenants: [TENANT], active_roles: [ROL] };
  if (/^\/api\/v2\/tenants\/[^/]+\/branding$/.test(pathname)) return { currency: "DOP", locale: "es-DO" };
  if (pathname === "/api/v2/auth/logout") return {};
  if (metodo !== "GET") return undefined;
  if (pathname === "/api/v1/autos/me/dealer-context") return { assignments: [] };
  if (pathname === "/api/v1/contable/fiscal/documents") return [];
  if (pathname === "/api/v1/contable/plan-cuentas") return CUENTAS;
  if (pathname === "/api/v1/contable/periodos") return PERIODOS;
  if (pathname === "/api/v1/contable/mayor") return MAYOR;
  if (pathname === "/api/v1/contable/balance-comprobacion") return BALANCE;
  return undefined;
}

type Registro = { externas: string[]; sinFixture: string[] };

/** Intercepta TODO el trafico del contexto: lo local que no es /api pasa; /api y backend.invalid con fixtures; lo demas se aborta. */
async function interceptarBackend(context: BrowserContext, origenLocal: string): Promise<Registro> {
  const reg: Registro = { externas: [], sinFixture: [] };
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const esLocal = url.origin === origenLocal;
    const esBackendFalso = url.hostname === "backend.invalid";
    if (esLocal && !url.pathname.startsWith("/api/")) return route.continue();
    if (!esLocal && !esBackendFalso) {
      reg.externas.push(url.origin + url.pathname);
      return route.abort("blockedbyclient");
    }
    const cuerpo = fixtureDe(url.pathname, route.request().method());
    if (cuerpo === undefined) {
      reg.sinFixture.push(`${route.request().method()} ${url.pathname}`);
      return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "sin fixture" }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(cuerpo) });
  });
  return reg;
}

async function sesionQA(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => window.localStorage.setItem("nadakki_refresh_token_v2", "rt-fixture"));
}

const PANTALLAS = [
  { nombre: "Plan de cuentas", ruta: "/contable/plan-cuentas", titulo: "Plan de cuentas", listo: null },
  { nombre: "Libro mayor", ruta: "/contable/libro-mayor", titulo: "Libro mayor", listo: null },
  // "Crear asiento" tambien es el h1 del estado "Cargando catalogo"; la descripcion final lo distingue.
  { nombre: "Asientos", ruta: "/contable/asientos/nuevo", titulo: "Crear asiento", listo: "Doble partida" },
  { nombre: "Balance", ruta: "/contable/balance", titulo: "Balance de comprobación", listo: null }, // redirige a balance-comprobacion
] as const;

type Malo = { contraste: number; color: string; fondo: string; etiqueta: string; texto: string };

async function peoresContrastes(page: Page): Promise<{ revisados: number; controles: number; malos: Malo[] }> {
  return page.evaluate(() => {
    const parse = (s: string) => {
      const m = s.match(/[\d.]+/g)!.map(Number);
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
    };
    const lum = (c: { r: number; g: number; b: number }) => {
      const f = (x: number) => {
        const v = x / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const fondoDe = (el: Element) => {
      // Capas translucidas se componen sobre el fondo opaco que tengan debajo.
      const capas: Array<{ r: number; g: number; b: number; a: number }> = [];
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.a > 0) capas.push(c);
        if (c.a >= 1) break;
      }
      let base = capas.length && capas[capas.length - 1].a >= 1 ? capas.pop()! : { r: 255, g: 255, b: 255, a: 1 };
      while (capas.length) {
        const c = capas.pop()!;
        base = {
          r: c.r * c.a + base.r * (1 - c.a),
          g: c.g * c.a + base.g * (1 - c.a),
          b: c.b * c.a + base.b * (1 - c.a),
          a: 1,
        };
      }
      return base;
    };
    const malos: Malo[] = [];
    let revisados = 0;
    let controles = 0;
    const visto = new Set<string>();
    const medir = (el: Element, fgStr: string, texto: string, etiqueta: string) => {
      const fg = parse(fgStr);
      const bg = fondoDe(el);
      const fgOpaco = {
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
      };
      const [a, b] = [lum(fgOpaco), lum(bg)].sort((x, y) => y - x);
      const ratio = (a + 0.05) / (b + 0.05);
      revisados++;
      const clave = `${etiqueta}|${fgStr}|${bg.r}|${bg.g}|${bg.b}|${texto.slice(0, 20)}`;
      if (ratio < 4.5 && !visto.has(clave)) {
        visto.add(clave);
        malos.push({ contraste: Math.round(ratio * 100) / 100, color: fgStr, fondo: `rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0})`, etiqueta, texto: texto.slice(0, 40) });
      }
    };
    // Campos: el texto que el usuario ve dentro (valor, opcion elegida, placeholder) no son nodos de texto hijos.
    for (const el of Array.from(document.body.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select"))) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0) continue;
      if ((el as HTMLInputElement).disabled) continue;
      const tag = el.tagName.toLowerCase();
      const valor =
        tag === "select"
          ? ((el as HTMLSelectElement).selectedOptions[0]?.text ?? "")
          : (el as HTMLInputElement | HTMLTextAreaElement).value;
      if (valor.trim()) {
        controles++;
        medir(el, cs.color, valor, tag);
      } else if ((el as HTMLInputElement).placeholder) {
        controles++;
        medir(el, getComputedStyle(el, "::placeholder").color, (el as HTMLInputElement).placeholder, `${tag}::placeholder`);
      }
    }
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const propio = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? "")
        .join(" ")
        .trim();
      if (!propio) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0) continue;
      if (el.closest("[disabled], option, script, style, noscript, nextjs-portal")) continue;
      medir(el, cs.color, propio, el.tagName.toLowerCase());
    }
    return { revisados, controles, malos };
  });
}

test.describe("MF3-T3 contable legible", () => {
  test("Plan de cuentas, Libro mayor, Asientos y Balance >= 4.5:1 en claro y oscuro", async ({ browser, baseURL }) => {
    test.setTimeout(300_000);
    const origen = new URL(baseURL!).origin;
    const context = await browser.newContext({ baseURL });
    const reg = await interceptarBackend(context, origen);
    await sesionQA(context);
    const page = await context.newPage();

    for (const tema of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: tema });
      let camposTema = 0;
      for (const p of PANTALLAS) {
        await test.step(`${p.nombre} (${tema})`, async () => {
          await page.goto(p.ruta);
          await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
          await page.evaluate((t) => {
            document.documentElement.classList.toggle("dark", t === "dark");
            document.documentElement.setAttribute("data-theme", t);
          }, tema);
          await expect(page.getByRole("heading", { level: 1, name: p.titulo })).toBeVisible({ timeout: 45_000 });
          if (p.listo) await expect(page.getByText(p.listo).first()).toBeVisible({ timeout: 45_000 });
          await page.waitForLoadState("networkidle").catch(() => {});
          const { revisados, controles, malos } = await peoresContrastes(page);
          expect(revisados, `${p.nombre}: no se reviso ningun texto`).toBeGreaterThan(5);
          camposTema += controles;
          expect(malos, `${p.nombre} (${tema}) tiene texto con contraste < 4.5:1`).toEqual([]);
        });
      }
      expect(camposTema, `(${tema}) ningun campo revisado en las 4 pantallas`).toBeGreaterThan(0);
    }
    expect(reg.externas, "llamadas externas (api.nadakki.com u otro host) durante las 4 pantallas").toEqual([]);
    expect(reg.sinFixture, "llamadas al backend sin fixture").toEqual([]);
    await context.close();
    console.log("RESULT_MF3_T3=PASS");
  });

  test("ninguna llamada sale hacia api.nadakki.com: se aborta y queda anotada", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const reg = await interceptarBackend(context, new URL(baseURL!).origin);
    // about:blank no tiene CSP: la peticion llega a la red y es el interceptor quien la aborta y la anota.
    const page = await context.newPage();
    const resultado = await page.evaluate(() =>
      fetch("https://api.nadakki.com/api/v2/auth/me").then(() => "salio", () => "bloqueada"),
    );
    expect(resultado).toBe("bloqueada");
    expect(reg.externas).toEqual(["https://api.nadakki.com/api/v2/auth/me"]);
    await context.close();
  });
});
