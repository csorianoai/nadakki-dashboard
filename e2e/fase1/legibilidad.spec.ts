/**
 * D7-LEGIBILIDAD — contraste de color legible en marketing con el tema guardado 'graphite' (oscuro).
 *
 * Ejecuta SOLO la regla axe 'color-contrast' (WCAG AA: 4.5:1, 3:1 en texto grande) sobre lo RENDERIZADO.
 * Hermetico: la sesion y todo /api se interceptan (context.route) con datos fijos del tenant QA; lo externo se aborta.
 *
 *   npx playwright test e2e/fase1/legibilidad.spec.ts --reporter=line
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

/** TODA pantalla nueva de marketing se anade aqui. `pasos`: clics en "Siguiente" para medir cada paso de un asistente. */
const PANTALLAS: Array<{ nombre: string; ruta: string; pasos?: number; pendiente?: string }> = [
  { nombre: "AME", ruta: "/ame" },
  { nombre: "Campanas", ruta: "/marketing/campaigns" },
  { nombre: "Nueva campana", ruta: "/marketing/campaigns/new", pasos: 4 },
  { nombre: "Google Ads", ruta: "/advertising/google-ads", pendiente: "parte 3" },
  { nombre: "Social inbox", ruta: "/social/inbox", pendiente: "parte 3" },
];

const TENANT = { id: "00000000-0000-4000-8000-0000000000a1", slug: "qa", display_name: "QA", subscribed_cores: ["marketing"], is_demo: false };
const USER = { id: "u-qa", email: "qa@example.invalid", name: "QA", is_active: true, mfa_enabled: false };
const ROL = { core_name: "marketing", role_key: "tenant_admin", display_name: "Administrador" };
const TOKEN = "e2e.fixture.token";

function fixtureDe(pathname: string, metodo: string): unknown | undefined {
  if (pathname === "/api/v2/auth/refresh") return { access_token: TOKEN, refresh_token: "rt-fixture", expires_in: 3600 };
  if (pathname === "/api/v2/auth/me") return { user: USER, current_tenant: TENANT, all_tenants: [TENANT], active_roles: [ROL] };
  if (/^\/api\/v2\/tenants\/[^/]+\/branding$/.test(pathname)) return { currency: "USD", locale: "es" };
  if (pathname === "/api/v2/auth/logout") return {};
  if (metodo !== "GET") return undefined;
  if (/templates/.test(pathname))
    return { templates: [
      { id: "t1", name: "Convert — EMAIL", type: "email", objective: "convert" },
      { id: "t2", name: "Convert — SMS", type: "sms", objective: "convert" },
      { id: "t3", name: "Recover — EMAIL", type: "email", objective: "recover" },
    ], total: 3 };
  if (/segments/.test(pathname)) return { segments: [{ id: "s1", name: "Clientes activos", size: 120 }], total: 1 };
  if (/campaigns/.test(pathname)) return { campaigns: [{ id: "c1", name: "Campana de prueba", status: "draft", channel: "email" }], total: 1 };
  if (/\/ame\//.test(pathname)) return { status: "idle", overall: "idle", runs: [], items: [] };
  return {};
}

async function interceptarBackend(context: BrowserContext, origenLocal: string): Promise<string[]> {
  const externas: string[] = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const esLocal = url.origin === origenLocal;
    if (esLocal && !url.pathname.startsWith("/api/")) return route.continue();
    if (!esLocal && url.hostname !== "backend.invalid") {
      externas.push(url.origin + url.pathname);
      return route.abort("blockedbyclient");
    }
    const cuerpo = fixtureDe(url.pathname, route.request().method());
    return route.fulfill({ status: cuerpo === undefined ? 404 : 200, contentType: "application/json", body: JSON.stringify(cuerpo ?? { detail: "sin fixture" }) });
  });
  return externas;
}

/** Rellena lo minimo del asistente para que "Siguiente" se habilite (nombre, plantilla, segmento). */
async function completarPaso(page: Page): Promise<void> {
  const nombre = page.getByPlaceholder(/Serie de bienvenida/);
  if (await nombre.count()) {
    if (!(await nombre.inputValue())) await nombre.fill("Campana de prueba");
    await page.getByRole("button", { name: /Convert — EMAIL/ }).click();
  }
  const segmento = page.getByRole("button", { name: /Clientes activos/ });
  if (await segmento.count()) await segmento.click();
}

/** Luminancia relativa WCAG de un color sRGB 0-255. */
const luz = (r: number, g: number, b: number): number => {
  const c = [r, g, b].map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

/**
 * axe no puede decidir el fondo de lo que va sobre un degradado (p. ej. GlassCard) y lo devuelve como `incomplete`.
 * Para esos nodos se mide sobre PIXELES reales: se captura el elemento con su texto transparente (queda solo el fondo
 * renderizado), se toma el peor pixel frente al color del texto y se compara con 4.5 (3 si es texto grande).
 */
async function contrastePixeles(page: Page, selector: string): Promise<string | null> {
  const el = page.locator(selector).first();
  // Centrado en el area visible: los encabezados fijos (pestanas, barra de pasos) no lo tapan al capturarlo.
  await el.evaluate((n) => n.scrollIntoView({ block: "center", inline: "nearest" }));
  await page.waitForTimeout(100);
  const info = await el.evaluate((n) => {
    const cs = getComputedStyle(n);
    const m = cs.color.match(/[\d.]+/g)!.map(Number);
    let op = 1;
    for (let e: Element | null = n; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    return { rgb: m.slice(0, 3), alpha: (m[3] ?? 1) * op, px: parseFloat(cs.fontSize), peso: parseInt(cs.fontWeight, 10) || 400 };
  });
  const png = await el.screenshot({ style: "*{color:transparent !important;caret-color:transparent !important;text-shadow:none !important;-webkit-text-fill-color:transparent !important}*::placeholder{color:transparent !important}" });
  const fondos: number[][] = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const cv = document.createElement("canvas");
    cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext("2d")!;
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, img.width, img.height).data;
    const out: number[][] = [];
    // Solo el interior (sin bordes, esquinas redondeadas ni franjas de encabezados fijos que rozan el borde): banda central, donde va el texto.
    const mx = Math.min(6, Math.floor(img.width / 4)), my = Math.floor(img.height * 0.3);
    const paso = Math.max(1, Math.floor(((img.width - 2 * mx) * (img.height - 2 * my)) / 400));
    let k = 0;
    for (let y = my; y < img.height - my; y++) for (let x = mx; x < img.width - mx; x++) {
      if (k++ % paso) continue;
      const i = (y * img.width + x) * 4;
      out.push([d[i], d[i + 1], d[i + 2]]);
    }
    return out;
  }, png.toString("base64"));
  const grande = info.px >= 24 || (info.px >= 18.66 && info.peso >= 700);
  const umbral = grande ? 3 : 4.5;
  let peor = Infinity, cual = [0, 0, 0];
  for (const [r, g, b] of fondos) {
    // texto semitransparente: se mezcla con el fondo de ese pixel
    const t = info.rgb.map((v, i) => v * info.alpha + [r, g, b][i] * (1 - info.alpha));
    const l1 = luz(t[0], t[1], t[2]), l2 = luz(r, g, b);
    const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (cr < peor) { peor = cr; cual = [r, g, b]; }
  }
  return peor < umbral ? `contraste real ${peor.toFixed(2)} < ${umbral} (pixeles renderizados, texto ${info.px}px ${info.rgb.join(',')} sobre ${cual.join(',')})` : null;
}

/** Contenedores con scroll propio (y la ventana): axe no evalua lo que queda bajo el pliegue, hay que traerlo a la vista. */
async function posicionesDeScroll(page: Page): Promise<number> {
  return page.evaluate(() => {
    const hs = [document.documentElement, ...Array.from(document.querySelectorAll<HTMLElement>("*"))]
      .filter((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY) || e === document.documentElement)
      .map((e) => Math.ceil(e.scrollHeight / Math.max(1, e.clientHeight * 0.8)));
    return Math.min(12, Math.max(1, ...hs));
  });
}

async function scrollA(page: Page, i: number): Promise<void> {
  await page.evaluate((k) => {
    const els = [document.documentElement, ...Array.from(document.querySelectorAll<HTMLElement>("*"))]
      .filter((e) => e.scrollHeight > e.clientHeight + 40 && (/auto|scroll/.test(getComputedStyle(e).overflowY) || e === document.documentElement));
    for (const e of els) e.scrollTop = k * e.clientHeight * 0.8;
  }, i);
  await page.waitForTimeout(150);
}

/**
 * Mide violations Y incomplete de 'color-contrast' en cada posicion de scroll.
 * `incomplete` NO se descarta: los de degradado se miden sobre pixeles; el unico motivo excluido es
 * "content too short" (circulos numericos de 1-2 caracteres: axe no los mide, y son decorativos junto a su etiqueta).
 */
async function contraste(page: Page): Promise<string[]> {
  const malos = new Map<string, string>();
  const pendientes = new Map<string, string>();
  const n = await posicionesDeScroll(page);
  for (let i = 0; i < n; i++) {
    await scrollA(page, i);
    const r = await new AxeBuilder({ page }).include("#main-content").withRules(["color-contrast"]).analyze();
    for (const v of r.violations) for (const nodo of v.nodes) malos.set(nodo.target.join(" "), nodo.any[0]?.message ?? v.help);
    for (const v of r.incomplete) for (const nodo of v.nodes) {
      const motivo = nodo.any[0]?.message ?? v.help;
      if (/too short/i.test(motivo)) continue;
      pendientes.set(nodo.target.join(" "), motivo);
    }
  }
  for (const [sel, motivo] of pendientes) {
    if (malos.has(sel)) continue;
    let res: string | null;
    try { res = await contrastePixeles(page, sel); } catch (e) { res = `no medible (${motivo}): ${(e as Error).message.split("\n")[0]}`; }
    if (res) malos.set(sel, res);
  }
  return [...malos].map(([sel, m]) => `${sel} :: ${m}`);
}


for (const p of PANTALLAS) {
  test(`contraste ${p.nombre} (${p.ruta}) con tema graphite`, async ({ page, context, baseURL }) => {
    test.setTimeout(240_000);
    test.fixme(!!p.pendiente, `se arregla en la ${p.pendiente} de D7-LEGIBILIDAD`);
    const externas = await interceptarBackend(context, new URL(baseURL!).origin);
    await context.addInitScript((tenantId) => {
      // Sesion heredada (AuthContext/TenantContext): sin ella el asistente de campanas no recibe tenant y no pide plantillas.
      window.localStorage.setItem("nadakki_auth", "true");
      window.localStorage.setItem("nadakki_tenant_id", tenantId);
      window.localStorage.setItem("nadakki_refresh_token_v2", "rt-fixture");
      window.localStorage.setItem("nadakki-theme", "graphite");
    }, TENANT.id);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(p.ruta, { waitUntil: "networkidle", timeout: 200_000 });
    await page.waitForTimeout(1500);
    const malos: string[] = [];
    for (let paso = 0; paso <= (p.pasos ?? 0); paso++) {
      if (paso > 0) {
        await completarPaso(page);
        await page.getByRole("button", { name: /Siguiente/ }).click();
        await page.waitForTimeout(500);
      }
      malos.push(...(await contraste(page)).map((m) => `[paso ${paso + 1}] ${m}`));
    }
    expect(malos, `nodos con contraste insuficiente en ${p.ruta}:\n${malos.join("\n")}`).toEqual([]);
    expect(externas, "ninguna llamada debe salir del servidor local").toEqual([]);
  });
}
