/**
 * LIMPIEZA del ensayo sintetico. NO depende de resultado.json: sirve tambien despues de una ejecucion que fallo a medias.
 * Busca en el inventario del dealer QA TODO vehiculo cuyo stock_number empiece por «QA-ENSAYO» (el sello de ensayo.spec.ts) y lo
 * deja ARCHIVADO (nada publico, nada en borrador a medias); despues comprueba que el portal QA queda sin unidades.
 *
 * Lo que NO se puede borrar (vehicle_cost_entries es append-only): los costos, su anulacion y los asientos. Quedan dentro del tenant
 * QA; MAPAAL no se toca nunca.
 *
 * Entorno: QA_AUTOS_USER, QA_AUTOS_PASSWORD. Opcionales: QA_AUTOS_BASE_URL, QA_AUTOS_TENANT_SLUG, QA_AUTOS_API_URL, QA_AUTOS_PORTAL_HOST.
 */
import { test, expect } from "@playwright/test";

const USER = process.env.QA_AUTOS_USER ?? "";
const PASS = process.env.QA_AUTOS_PASSWORD ?? "";
const SLUG = process.env.QA_AUTOS_TENANT_SLUG ?? "qa-autos";
const API = (process.env.QA_AUTOS_API_URL ?? "https://api.nadakki.com").replace(/\/$/, "");
const PORTAL = process.env.QA_AUTOS_PORTAL_HOST ?? "qa-autos.nadakki.com";
const SELLO = "QA-ENSAYO";

function claims(jwt: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8"));
}

test("archivar los vehiculos sinteticos y dejar el portal QA vacio", async ({ request }) => {
  expect(USER && PASS, "faltan QA_AUTOS_USER / QA_AUTOS_PASSWORD").toBeTruthy();

  const l = await request.post("/api/v2/auth/login", { data: { email: USER, password: PASS, tenant_slug: SLUG } });
  expect(l.status(), "login").toBe(200);
  const cuerpo = await l.json();
  const token = String(cuerpo.access_token);
  const tenantId = String(claims(token).tenant_id ?? cuerpo.tenant_info?.id ?? "");
  const auth = { Authorization: `Bearer ${token}` };

  const dc = await request.get("/api/v1/autos/me/dealer-context", { headers: auth });
  expect(dc.status(), "dealer-context").toBe(200);
  const dealerId = String((await dc.json()).assignments?.[0]?.dealer_id ?? "");
  expect(tenantId && dealerId, "sin tenant o dealer").toBeTruthy();

  const inv = await request.get(`/api/v1/autos/dealers/${dealerId}/vehicles`, { headers: auth });
  expect(inv.status(), "inventario del dealer").toBe(200);
  const todos: Array<{ id: string; status: string; stock_number?: string | null }> = (await inv.json()).vehicles ?? [];
  const sinteticos = todos.filter((v) => String(v.stock_number ?? "").startsWith(SELLO));
  const sospechosos = todos.filter((v) => !String(v.stock_number ?? "").startsWith(SELLO));

  for (const v of sinteticos) {
    if (v.status === "archivado" || v.status === "vendido") continue;
    const p = await request.patch(`/api/v1/autos/tenants/${tenantId}/dealers/${dealerId}/vehicles/${v.id}`, {
      headers: auth,
      data: { status: "archivado" },
    });
    expect(p.status(), `archivar ${v.id} (${v.status}): HTTP ${p.status()} ${(await p.text()).slice(0, 200)}`).toBeLessThan(300);
  }
  console.log(`limpieza: ${sinteticos.length} vehiculos sinteticos archivados; ${sospechosos.length} vehiculos del dealer QA sin el sello (no se tocan)`);

  const b = await request.post(`${API}/api/v1/autos/vehicles/search`, {
    headers: { "X-Portal-Host": PORTAL },
    data: { page: 1, page_size: 50 },
  });
  expect(b.status(), "busqueda del portal QA").toBe(200);
  const texto = await b.text();
  for (const v of sinteticos) expect(texto, `el vehiculo ${v.id} sigue publico`).not.toContain(v.id);
  expect(((JSON.parse(texto) as { total?: number }).total ?? 0), "el portal QA debe quedar sin unidades publicadas").toBe(0);
});
