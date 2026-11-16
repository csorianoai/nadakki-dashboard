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

async function contraste(page: Page): Promise<string[]> {
  const r = await new AxeBuilder({ page }).include("#main-content").withRules(["color-contrast"]).analyze();
  return r.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(" ")} :: ${n.any[0]?.message ?? v.help}`));
}

test.describe.configure({ mode: "serial" });

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
