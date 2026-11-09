/**
 * LIMPIEZA del ensayo sintetico: despublica los vehiculos sinteticos y comprueba que el portal QA queda vacio.
 * Lee e2e/ensayo-qa-autos/resultado.json (lo escribe ensayo.spec.ts). Los costos, la anulacion y los asientos NO se pueden
 * borrar (vehicle_cost_entries es append-only): quedan dentro del tenant QA y MAPAAL no se toca nunca.
 *
 * Entorno: QA_AUTOS_USER, QA_AUTOS_PASSWORD. Opcionales: QA_AUTOS_BASE_URL, QA_AUTOS_TENANT_SLUG, QA_AUTOS_API_URL, QA_AUTOS_PORTAL_HOST.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const USER = process.env.QA_AUTOS_USER ?? "";
const PASS = process.env.QA_AUTOS_PASSWORD ?? "";
const SLUG = process.env.QA_AUTOS_TENANT_SLUG ?? "qa-autos";
const API = (process.env.QA_AUTOS_API_URL ?? "https://api.nadakki.com").replace(/\/$/, "");
const PORTAL = process.env.QA_AUTOS_PORTAL_HOST ?? "qa-autos.nadakki.com";

test("despublicar los vehiculos sinteticos y dejar el portal QA vacio", async ({ request }) => {
  expect(USER && PASS, "faltan QA_AUTOS_USER / QA_AUTOS_PASSWORD").toBeTruthy();
  const r = JSON.parse(readFileSync(path.join(__dirname, "resultado.json"), "utf8"));
  const ids: string[] = [r.visibleId, r.borradorId].filter(Boolean);
  expect(r.tenantId && r.dealerId && ids.length, "resultado.json incompleto").toBeTruthy();

  const l = await request.post("/api/v2/auth/login", { data: { email: USER, password: PASS, tenant_slug: SLUG } });
  expect(l.status(), "login").toBe(200);
  const token = String((await l.json()).access_token);
  const auth = { Authorization: `Bearer ${token}` };

  // Solo el vehiculo VISIBLE se despublica: el borrador del ensayo ya quedo en borrador en el paso 08 (draft -> draft no es una transicion).
  for (const id of [r.visibleId].filter(Boolean) as string[]) {
    const p = await request.patch(`/api/v1/autos/tenants/${r.tenantId}/dealers/${r.dealerId}/vehicles/${id}`, {
      headers: auth,
      data: { status: "draft" },
    });
    expect(p.status(), `despublicar ${id}: HTTP ${p.status()} ${(await p.text()).slice(0, 200)}`).toBeLessThan(300);
  }

  const b = await request.post(`${API}/api/v1/autos/vehicles/search`, {
    headers: { "X-Portal-Host": PORTAL },
    data: { page: 1, page_size: 50 },
  });
  expect(b.status(), "busqueda del portal QA").toBe(200);
  const cuerpo = await b.text();
  for (const id of ids) expect(cuerpo, `el vehiculo ${id} sigue publico`).not.toContain(id);
  const total = (JSON.parse(cuerpo) as { total?: number }).total;
  expect(total ?? 0, "el portal QA debe quedar sin unidades publicadas").toBe(0);
});
