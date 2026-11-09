/**
 * ENSAYO GENERAL SINTETICO en produccion (tenant «Nadakki QA Autos», portal qa-autos.nadakki.com).
 * Recorre lo que hara Carolina. Todo lo que crea lleva el prefijo QA-ENSAYO y fotos rotuladas «QA SINTETICO».
 *
 * SIN DNS NUEVO: el usuario QA entra por dashboard.nadakki.com (baseURL) y todo lo autenticado va por su BFF. La parte PUBLICA
 * se comprueba contra la API directa (QA_AUTOS_API_URL, por defecto https://api.nadakki.com) con la cabecera
 * X-Portal-Host: qa-autos.nadakki.com: por el BFF no sirve, porque el BFF deriva el portal del host real de la peticion.
 *
 * Entorno: QA_AUTOS_USER, QA_AUTOS_PASSWORD (obligatorias). Opcionales: QA_AUTOS_BASE_URL, QA_AUTOS_TENANT_SLUG,
 * QA_AUTOS_API_URL, QA_AUTOS_PORTAL_HOST.
 * Escribe el resultado en e2e/ensayo-qa-autos/resultado.json (ids para el certificador).
 * NUNCA imprime la contrasena ni el token.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { writeFileSync } from "node:fs";
import path from "node:path";

const USER = process.env.QA_AUTOS_USER ?? "";
const PASS = process.env.QA_AUTOS_PASSWORD ?? "";
const SLUG = process.env.QA_AUTOS_TENANT_SLUG ?? "qa-autos";
const API = (process.env.QA_AUTOS_API_URL ?? "https://api.nadakki.com").replace(/\/$/, "");
const PORTAL = process.env.QA_AUTOS_PORTAL_HOST ?? "qa-autos.nadakki.com";
const CABECERA_PORTAL = { "X-Portal-Host": PORTAL };
const SELLO = `QA-ENSAYO-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;
const PRECIO = 12345678; // inconfundible: la ficha y el filtro lo tienen que mostrar tal cual
const INVENTADOS = /Banco Piloto|Credicefi|Precio justo|15 usuarios|47 vendidos|Aliados bancarios/i;
const CACHE_PUBLICA_S = 60; // s-maxage de la ficha (routers/autos_portal_router.py:488)

type Ctx = { token: string; tenantId: string; dealerId: string };
const estado: Record<string, unknown> = { sello: SELLO };
let ctx: Ctx;
let vehiculoId = "";
let costoAnulableId = "";

function claims(jwt: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8"));
}
const auth = () => ({ Authorization: `Bearer ${ctx.token}` });

async function json(r: Awaited<ReturnType<APIRequestContext["get"]>>, etiqueta: string) {
  const cuerpo = await r.text();
  expect(r.status(), `${etiqueta}: HTTP ${r.status()} ${cuerpo.slice(0, 300)}`).toBeLessThan(300);
  return cuerpo ? JSON.parse(cuerpo) : {};
}

async function fotoSintetica(browser: import("@playwright/test").Browser, n: number): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(
    `<body style="margin:0;background:#${["1e3a8a", "0e7c66", "6d28d9"][n % 3]};color:#fff;font:700 96px sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;height:720px">
      <div>QA SINTETICO</div><div style="font-size:40px">${SELLO} · foto ${n + 1}</div></body>`,
  );
  const buf = await page.screenshot({ type: "png" });
  await page.close();
  return buf;
}

test.describe.serial("ensayo general QA", () => {
  test.beforeAll(() => {
    expect(USER && PASS, "faltan QA_AUTOS_USER / QA_AUTOS_PASSWORD").toBeTruthy();
  });

  test("01 login y contexto del dealer", async ({ request }) => {
    const l = await json(await request.post("/api/v2/auth/login", { data: { email: USER, password: PASS, tenant_slug: SLUG } }), "login");
    expect(l.mfa_required, "el usuario QA no debe pedir MFA").toBeFalsy();
    const token = String(l.access_token);
    const tenantId = String(claims(token).tenant_id ?? l.tenant_info?.id ?? "");
    const dc = await json(await request.get("/api/v1/autos/me/dealer-context", { headers: { Authorization: `Bearer ${token}` } }), "dealer-context");
    const dealerId = String(dc.assignments?.[0]?.dealer_id ?? "");
    expect(tenantId && dealerId, `sin tenant/dealer: ${JSON.stringify(dc).slice(0, 200)}`).toBeTruthy();
    ctx = { token, tenantId, dealerId };
    estado.tenantId = tenantId;
    estado.portal = PORTAL;
    estado.dealerId = dealerId;
  });

  test("02 alta en BORRADOR con costos y fotos sinteticas", async ({ request, browser }) => {
    const base = `/api/v1/autos/tenants/${ctx.tenantId}/dealers/${ctx.dealerId}/vehicles`;
    const v = await json(await request.post(base, {
      headers: auth(),
      data: { make: "Toyota", model: `Corolla ${SELLO}`, year: 2020, condition: "used", mileage_km: 45000,
              price_amount: PRECIO, status: "draft", stock_number: SELLO },
    }), "alta vehiculo");
    vehiculoId = String(v.id);
    estado.vehiculoId = vehiculoId;
    expect(vehiculoId).toBeTruthy();

    const hoy = new Date().toISOString();
    for (const [tipo, monto] of [["purchase", "9000000"], ["repair", "350000"], ["transport", "120000"]] as const) {
      const c = await json(await request.post(`/api/v1/autos/vehicles/${vehiculoId}/costs`, {
        headers: auth(), data: { cost_type: tipo, amount: monto, currency: "ARS", incurred_at: hoy },
      }), `costo ${tipo}`);
      if (tipo === "transport") costoAnulableId = String(c.id ?? c.cost_id ?? "");
    }
    for (let i = 0; i < 3; i++) {
      const png = await fotoSintetica(browser, i);
      await json(await request.post(`/api/v1/autos/vehicles/${vehiculoId}/photos`, {
        headers: auth(), multipart: { file: { name: `qa-sintetico-${i + 1}.png`, mimeType: "image/png", buffer: png } },
      }), `foto ${i + 1}`);
    }
    const t = await json(await request.get(`/api/v1/autos/vehicles/${vehiculoId}/costs/total`, { headers: auth() }), "total costos");
    estado.totalAntes = t;
    expect(String(t[0]?.total_cost)).toMatch(/^9470000(\.0+)?$/);
  });

  test("03 el BORRADOR no sale en publico", async ({ request }) => {
    const ficha = await request.get(`${API}/api/v1/autos/vehicles/${vehiculoId}`);
    expect(ficha.status(), "la ficha publica de un borrador debe ser 404").toBe(404);
    const b = await json(await request.post(`${API}/api/v1/autos/vehicles/search`, { headers: CABECERA_PORTAL, data: { page: 1, page_size: 50 } }), "busqueda del portal QA");
    expect(JSON.stringify(b)).not.toContain(vehiculoId);
  });

  test("04 publicar con precio", async ({ request }) => {
    const r = await request.patch(`/api/v1/autos/tenants/${ctx.tenantId}/dealers/${ctx.dealerId}/vehicles/${vehiculoId}`, {
      headers: auth(), data: { status: "disponible" },
    });
    await json(r, "publicar");
  });

  test("05 ficha publica: sin VIN, precio real, sin inventados", async ({ request, page }) => {
    const api = await json(await request.get(`${API}/api/v1/autos/vehicles/${vehiculoId}`), "ficha api");
    expect(JSON.stringify(api)).not.toMatch(/"vin"\s*:\s*"[A-Z0-9]{17}"/i);
    expect(Number(api.price_amount ?? api.price)).toBe(PRECIO);
    await page.goto(`/autos/vehiculo/${vehiculoId}`);
    await expect(page.locator("body")).toContainText(/Corolla/);
    const texto = await page.locator("body").innerText();
    expect(texto).not.toMatch(INVENTADOS);
    expect(texto.replace(/[.,\s]/g, "")).toContain(String(PRECIO));
    await expect(page.getByText("Match My Approval")).toHaveCount(0);
  });

  test("06 buscar y filtrar por precio", async ({ request }) => {
    const buscar = (extra: Record<string, unknown>) =>
      request.post(`${API}/api/v1/autos/vehicles/search`, { headers: CABECERA_PORTAL, data: { page: 1, page_size: 50, ...extra } });
    const todos = await json(await buscar({}), "busqueda");
    expect(JSON.stringify(todos)).toContain(vehiculoId);
    const dentro = await json(await buscar({ price_min: PRECIO - 1, price_max: PRECIO + 1 }), "filtro dentro");
    expect(JSON.stringify(dentro)).toContain(vehiculoId);
    const fuera = await json(await buscar({ price_min: PRECIO + 1000 }), "filtro fuera");
    expect(JSON.stringify(fuera)).not.toContain(vehiculoId);
  });

  test("07 anular un costo: total y asiento de reverso", async ({ request }) => {
    if (!costoAnulableId) {
      const l = await json(await request.get(`/api/v1/autos/vehicles/${vehiculoId}/costs`, { headers: auth() }), "lista costos");
      const filas = Array.isArray(l) ? l : (l.items ?? l.costs ?? []);
      costoAnulableId = String(filas.find((f: any) => f.cost_type === "transport" && !f.voided && !f.is_reversal)?.id ?? "");
    }
    expect(costoAnulableId, "no se encontro el costo de transporte para anular").toBeTruthy();
    await json(await request.post(`/api/v1/autos/vehicles/${vehiculoId}/costs/${costoAnulableId}/void`, { headers: auth(), data: { reason: `${SELLO} anulacion de ensayo` } }), "anular costo");
    const t = await json(await request.get(`/api/v1/autos/vehicles/${vehiculoId}/costs/total`, { headers: auth() }), "total despues");
    estado.totalDespues = t;
    expect(String(t[0]?.total_cost), "el total debe bajar el costo anulado (120000)").toMatch(/^9350000(\.0+)?$/);
    const a = await json(await request.get("/api/v1/contable/asientos?status=posted", { headers: auth() }), "asientos");
    const lista = Array.isArray(a) ? a : (a.items ?? a.asientos ?? []);
    estado.asientos = lista.length;
    expect(lista.length, "tiene que haber asientos del vehiculo (compra, reparacion, transporte y reverso)").toBeGreaterThanOrEqual(4);
  });

  test("08 despublicar y medir la cache publica", async ({ request }) => {
    await json(await request.patch(`/api/v1/autos/tenants/${ctx.tenantId}/dealers/${ctx.dealerId}/vehicles/${vehiculoId}`, { headers: auth(), data: { status: "draft" } }), "despublicar");
    const t0 = Date.now();
    let s = 200;
    while (Date.now() - t0 < (CACHE_PUBLICA_S + 15) * 1000) {
      s = (await request.get(`${API}/api/v1/autos/vehicles/${vehiculoId}`)).status();
      if (s === 404) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
    estado.segundosHastaOculta = Math.round((Date.now() - t0) / 1000);
    expect(s, "la ficha sigue publica tras el tope de cache").toBe(404);
  });

  test("09 republicar para el certificador y dejar el resultado", async ({ request }) => {
    // El certificador necesita UN borrador y UN visible. Se publica un segundo vehiculo sintetico; este queda en borrador.
    const base = `/api/v1/autos/tenants/${ctx.tenantId}/dealers/${ctx.dealerId}/vehicles`;
    const v2 = await json(await request.post(base, {
      headers: auth(), data: { make: "Ford", model: `Fiesta ${SELLO}`, year: 2019, condition: "used", mileage_km: 60000,
                               price_amount: PRECIO + 1, status: "disponible", stock_number: `${SELLO}-B` },
    }), "alta visible");
    estado.borradorId = vehiculoId;
    estado.visibleId = String(v2.id);
    writeFileSync(path.join(__dirname, "resultado.json"), JSON.stringify(estado, null, 2));
  });
});
