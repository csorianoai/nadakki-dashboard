/**
 * PI-P0-2 — SpyFu por el BFF same-origin y verificación de firma del JWT.
 *
 * Requiere un despliegue construido con NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true.
 * Usa SOLO el usuario del tenant QA (QA_USER / QA_PASSWORD); nunca credenciales reales.
 *
 *   BASE_URL=... QA_USER=... QA_PASSWORD=... \
 *   npx playwright test --config e2e/api/playwright.config.ts e2e/api/bff-jwt.spec.ts
 */
import { expect, test, type Request } from "@playwright/test";

import { iniciarSesionQA } from "../mapaal/sesion-qa";

const BASE_URL = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "").replace(/\/$/, "");
const QA_USER = process.env.QA_USER ?? "";
const QA_PASSWORD = process.env.QA_PASSWORD ?? "";

test.use({ baseURL: BASE_URL || undefined });

/** Cambia el último carácter de la firma (tercer segmento) por otro distinto. */
function conFirmaAlterada(jwt: string): string {
  const [h, p, s = ""] = jwt.split(".");
  const ultimo = s.slice(-1) === "A" ? "B" : "A";
  return `${h}.${p}.${s.slice(0, -1)}${ultimo}`;
}

test("/competitor-research usa /api/v1/spyfu/* same-origin y rechaza un JWT con firma alterada", async ({ browser }) => {
  test.skip(!BASE_URL || !QA_USER || !QA_PASSWORD, "faltan BASE_URL, QA_USER o QA_PASSWORD");
  test.setTimeout(180_000);

  const page = await iniciarSesionQA(browser, { baseUrl: BASE_URL, usuario: QA_USER, clave: QA_PASSWORD });
  const origen = new URL(BASE_URL).origin;

  const spyfu: Request[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/v1/spyfu/")) spyfu.push(req);
  });

  await page.goto(`${BASE_URL}/competitor-research`);
  await expect.poll(() => spyfu.length, { timeout: 60_000, message: "la página no hizo peticiones a /api/v1/spyfu/*" })
    .toBeGreaterThan(0);

  for (const req of spyfu) {
    expect(new URL(req.url()).origin, `petición fuera de same-origin: ${new URL(req.url()).pathname}`).toBe(origen);
  }

  const conAuth = spyfu.find((r) => /^Bearer\s+\S+\.\S+\.\S+$/.test(r.headers()["authorization"] ?? ""));
  expect(conAuth, "ninguna petición SpyFu llevó Authorization: Bearer <jwt>").toBeTruthy();
  const jwt = conAuth!.headers()["authorization"].replace(/^Bearer\s+/, "");

  const alterado = await page.request.get(`${BASE_URL}/api/v1/spyfu/api-usage`, {
    headers: { Authorization: `Bearer ${conFirmaAlterada(jwt)}` },
  });
  expect(alterado.status(), "un JWT con firma alterada debe recibir 401 del backend").toBe(401);

  console.log("RESULT_PI_P0_2=PASS");
});
