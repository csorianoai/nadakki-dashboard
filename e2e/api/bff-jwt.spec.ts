/**
 * PI-P0-2 — SpyFu por el BFF same-origin (hermético, nivel ci).
 *
 * Requiere `next build` hecho con NEXT_PUBLIC_RENDER_API_URL=http://backend.invalid y
 * NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true; la config arranca `next start` y fija baseURL local.
 * No inicia sesión real: el JWT se firma con un secreto efímero generado en este test.
 *
 *   npx playwright test --config e2e/api/playwright.config.ts e2e/api/bff-jwt.spec.ts
 *
 * La prueba de que el BACKEND real responde 401 a un JWT con firma alterada se mide en el certificador
 * de PI-CERT-1 (paso «firma_alterada», nivel production). Aquí solo se prueba lo que es del dashboard.
 */
import { createHmac, randomBytes } from "node:crypto";
import { expect, test, type Request } from "@playwright/test";

import { conFirmaAlterada } from "./jwt-firma";

const b64 = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString("base64url");

function firmarJwt(secreto: string, tenant: string): string {
  const cuerpo = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: "usuario-prueba",
    tenant_id: tenant,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}`;
  return `${cuerpo}.${b64(createHmac("sha256", secreto).update(cuerpo).digest())}`;
}

test("/competitor-research solo habla con su origen y el BFF corta un JWT de firma alterada", async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const origen = new URL(baseURL!).origin;
  const jwt = firmarJwt(randomBytes(32).toString("hex"), "tenant-prueba-a");

  const spyfu: Request[] = [];
  const ajenos: string[] = [];
  const rol = { core_name: "suite", role_key: "viewer", display_name: "Viewer" };
  const tenant = { id: "tenant-prueba-a", slug: "prueba", display_name: "Prueba", subscribed_cores: [] };
  const json = (cuerpo: object) => ({ status: 200, contentType: "application/json", body: JSON.stringify(cuerpo) });

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.protocol !== "http:" && url.protocol !== "https:") return route.continue();
    if (url.pathname.startsWith("/api/v1/spyfu/")) spyfu.push(route.request());
    if (url.origin === origen) {
      // Los datos nunca salen: lo que la página pida a /api/* se responde aquí.
      return url.pathname.startsWith("/api/") ? route.fulfill(json({})) : route.continue();
    }
    // La inicialización de sesión (auth-v2, fuera del alcance de CC-4) habla con el backend declarado;
    // aquí se responde con un doble y no sale nunca a la red.
    ajenos.push(`${url.hostname}${url.pathname}`);
    if (url.pathname.endsWith("/auth/refresh")) {
      return route.fulfill(json({ access_token: jwt, refresh_token: "r-prueba", expires_in: 3600, active_role: rol }));
    }
    if (url.pathname.endsWith("/auth/me")) {
      const user = { id: "u-prueba", email: "prueba@example.invalid", is_active: true, mfa_enabled: false };
      return route.fulfill(json({ user, current_tenant: tenant, all_tenants: [tenant], active_roles: [rol] }));
    }
    return route.abort();
  });

  await page.addInitScript(
    ([t, id]) => {
      window.localStorage.setItem("nadakki_refresh_token_v2", t);
      window.localStorage.setItem("nadakki_auth", "true");
      window.localStorage.setItem("nadakki_tenant_id", id);
    },
    ["r-prueba", tenant.id],
  );
  await page.goto("/competitor-research");
  await expect
    .poll(() => spyfu.length, { timeout: 60_000, message: "la página no hizo peticiones a /api/v1/spyfu/*" })
    .toBeGreaterThan(0);
  await page.waitForTimeout(1_000);

  // (a) /competitor-research solo emite peticiones SpyFu a su mismo origen local; el único otro host es el
  // backend declarado, y solo para la sesión (/auth/*), nunca para /api/v1/spyfu/*
  for (const req of spyfu) expect(new URL(req.url()).origin).toBe(origen);
  expect(new URL(origen).hostname).toBe("localhost");
  expect(ajenos.filter((r) => !/\/auth\//.test(r) || !r.startsWith("backend.invalid/"))).toEqual([]);

  // (b) JWT de firma alterada contra el BFF real (sin interceptar): 401/403 del BFF, nunca 200
  const alterado = conFirmaAlterada(jwt);
  expect(alterado).not.toBe(jwt);
  const res = await page.request.get(`${origen}/api/v1/spyfu/api-usage`, {
    headers: { Authorization: `Bearer ${alterado}`, "X-Tenant-ID": "tenant-prueba-b" },
  });
  expect([401, 403]).toContain(res.status());

  console.log("RESULT_PI_P0_2=PASS");
});
