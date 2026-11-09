/**
 * PRUEBA DE HUMO del almacen PUBLICO de fotos (S3_PUBLIC_MEDIA_BUCKET + MEDIA_CDN_BASE_URL) en el tenant QA.
 * Sube UNA foto sintetica a un vehiculo en borrador del dealer QA, la lee SIN sesion por su URL publica, comprueba que el bucket crudo
 * NO es legible, la lista, la borra y deja el vehiculo en borrador (la limpieza del ensayo lo archiva: stock_number «QA-ENSAYO-HUMO...»).
 *
 * Entorno: QA_AUTOS_USER, QA_AUTOS_PASSWORD. Opcionales: QA_AUTOS_BASE_URL, QA_AUTOS_TENANT_SLUG,
 *   QA_AUTOS_MEDIA_BASE (por defecto https://media.nadakki.com), QA_AUTOS_BUCKET_HOST (p. ej. nadakki-public-media-prod.s3.us-east-1.amazonaws.com).
 */
import { test, expect } from "@playwright/test";

const USER = process.env.QA_AUTOS_USER ?? "";
const PASS = process.env.QA_AUTOS_PASSWORD ?? "";
const SLUG = process.env.QA_AUTOS_TENANT_SLUG ?? "qa-autos";
const MEDIA = (process.env.QA_AUTOS_MEDIA_BASE ?? "https://media.nadakki.com").replace(/\/$/, "");
const BUCKET_HOST = process.env.QA_AUTOS_BUCKET_HOST ?? "";
const SELLO = `QA-ENSAYO-HUMO-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;

function claims(jwt: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8"));
}

test("subir una foto, leerla en publico, no leerla en el bucket crudo y borrarla", async ({ request, browser }) => {
  expect(USER && PASS, "faltan QA_AUTOS_USER / QA_AUTOS_PASSWORD").toBeTruthy();
  const l = await request.post("/api/v2/auth/login", { data: { email: USER, password: PASS, tenant_slug: SLUG } });
  expect(l.status(), "login").toBe(200);
  const lj = await l.json();
  const token = String(lj.access_token);
  const tenantId = String(claims(token).tenant_id ?? lj.tenant_info?.id ?? "");
  const auth = { Authorization: `Bearer ${token}` };
  const dc = await request.get("/api/v1/autos/me/dealer-context", { headers: auth });
  const dealerId = String((await dc.json()).assignments?.[0]?.dealer_id ?? "");
  expect(tenantId && dealerId, "sin tenant o dealer").toBeTruthy();

  const v = await request.post(`/api/v1/autos/tenants/${tenantId}/dealers/${dealerId}/vehicles`, {
    headers: auth,
    data: { make: "Toyota", model: `Humo ${SELLO}`, year: 2020, condition: "used", price_amount: 1000000, status: "draft", stock_number: SELLO },
  });
  expect(v.status(), `alta del vehiculo de humo: ${(await v.text()).slice(0, 200)}`).toBeLessThan(300);
  const vehiculoId = String((await v.json()).id);

  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  await page.setContent(`<body style="margin:0;background:#0e7c66;color:#fff;font:700 64px sans-serif;display:flex;align-items:center;justify-content:center;height:450px">QA SINTETICO · humo fotos</body>`);
  const png = await page.screenshot({ type: "png" });
  await page.close();

  // 1. subir: aqui estaba el 503 media_storage_unconfigured
  const up = await request.post(`/api/v1/autos/vehicles/${vehiculoId}/photos`, {
    headers: auth,
    multipart: { file: { name: "qa-sintetico-humo.png", mimeType: "image/png", buffer: png } },
  });
  const upTxt = await up.text();
  expect(up.status(), `subida: HTTP ${up.status()} ${upTxt.slice(0, 300)}`).toBe(201);
  const { media_id: mediaId, cdn_url: cdnUrl } = JSON.parse(upTxt) as { media_id: string; cdn_url: string };
  expect(cdnUrl.startsWith(`${MEDIA}/`), `cdn_url ${cdnUrl} no empieza por MEDIA_CDN_BASE_URL (${MEDIA})`).toBe(true);
  expect(cdnUrl).toContain(`/${tenantId}/${vehiculoId}/`);
  expect(cdnUrl, "la clave debe ser opaca (uuid.ext), no el nombre del cliente").not.toContain("humo");

  // 2. leerla SIN sesion por la URL publica
  const pub = await request.get(cdnUrl, { headers: {} });
  expect(pub.status(), `lectura publica de ${cdnUrl}`).toBe(200);
  expect(pub.headers()["content-type"]).toContain("image/png");
  expect(pub.headers()["cache-control"] ?? "").toContain("immutable");
  expect((await pub.body()).length).toBeGreaterThan(1000);

  // 3. el bucket crudo NO es legible (con CloudFront + OAC el bucket sigue privado)
  if (BUCKET_HOST) {
    const clave = new URL(cdnUrl).pathname;
    const crudo = await request.get(`https://${BUCKET_HOST}${clave}`);
    expect([403, 404], `el bucket crudo es legible (HTTP ${crudo.status()}): la lectura publica debe pasar solo por el CDN`).toContain(crudo.status());
  }

  // 4. la lista del vehiculo la trae, sin el nombre del cliente
  const lista = await request.get(`/api/v1/autos/vehicles/${vehiculoId}/photos`, { headers: auth });
  expect(lista.status()).toBe(200);
  const cuerpo = await lista.text();
  expect(cuerpo).toContain(mediaId);
  expect(cuerpo).not.toContain("qa-sintetico-humo");

  // 5. borrarla (idempotente del lado del objeto)
  const del = await request.delete(`/api/v1/autos/vehicles/${vehiculoId}/photos/${mediaId}`, { headers: auth });
  expect(del.status(), `borrado: ${(await del.text()).slice(0, 200)}`).toBe(200);
  const tras = await request.get(`/api/v1/autos/vehicles/${vehiculoId}/photos`, { headers: auth });
  expect(await tras.text()).not.toContain(mediaId);
  // La copia en la cache del CDN puede seguir sirviendose hasta que venza (objeto «immutable»): no se afirma nada sobre ella.
});
