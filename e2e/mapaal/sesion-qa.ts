/**
 * Sesion del usuario QA en BASE_URL, para los specs de e2e/mapaal.
 *
 * BASE_URL es `mapaal.nadakki.com`: en ese host el login fija el tenant
 * `mapaal`, y el usuario QA, que es del tenant `mapaal-qa`, recibe 401
 * "Credenciales invalidas". Por eso el login se hace por el host universal
 * (antes se comprueba que sirve el mismo despliegue), con el tenant QA escrito.
 * Despues la sesion (el refresh token de localStorage) se lleva a BASE_URL.
 * Fuera del login nada mira el host. Es el mismo enfoque que D9 (#600).
 */
import { expect, type Browser, type Page } from "@playwright/test";

import { resolveDealerAdminHost } from "../../lib/dealer-management/admin-host";
import { PLACEHOLDER_TENANT, SLUG_QA, TENANT_QA, huellaDespliegue, origenDeLogin } from "./d9-guion";

export type CredencialesQA = { baseUrl: string; usuario: string; clave: string };

/**
 * Inicia sesion con el usuario QA y devuelve una pagina, todavia en blanco, de
 * un contexto en BASE_URL que ya tiene la sesion. Aborta si el tenant no es el QA.
 */
export async function iniciarSesionQA(browser: Browser, { baseUrl, usuario, clave }: CredencialesQA): Promise<Page> {
  const host = resolveDealerAdminHost(new URL(baseUrl).hostname);
  const origenLogin = origenDeLogin(baseUrl, host);
  const ctxLogin = await browser.newContext({ baseURL: baseUrl });

  if (origenLogin !== baseUrl) {
    const huellas = await Promise.all(
      [baseUrl, origenLogin].map(async (o) => huellaDespliegue(await (await ctxLogin.request.get(`${o}/login`)).text())),
    );
    console.log(`login QA: ${baseUrl} no admite el tenant ${SLUG_QA}; login por ${origenLogin}`);
    expect(huellas[0], `sin huella de despliegue en ${baseUrl}/login`).not.toBeNull();
    expect(huellas[1], `${origenLogin} no sirve el mismo despliegue que ${baseUrl}`).toBe(huellas[0]);
  }

  const login = await ctxLogin.newPage();
  await login.goto(`${origenLogin}/login`);
  await login.locator('input[type="email"]').fill(usuario);
  await login.locator('input[type="password"]').fill(clave);
  // Solo hay campo de tenant fuera de un subdominio de dealer; el de mapaal-qa ya lo fija.
  if (origenLogin !== baseUrl || host.mode !== "dealer_subdomain") {
    const campoTenant = login.getByPlaceholder(PLACEHOLDER_TENANT, { exact: true });
    await expect(campoTenant, "el login universal no pide el tenant").toBeVisible({ timeout: 30_000 });
    await campoTenant.fill(SLUG_QA);
  }
  await login.getByRole("button", { name: /Iniciar Sesi/i }).click();

  // O sale de /login, o el formulario dice por que no.
  const errorDelFormulario = login.locator("form .bg-red-50");
  await expect
    .poll(
      async () => {
        if (!new URL(login.url()).pathname.startsWith("/login")) return "fuera";
        if (await errorDelFormulario.isVisible()) return `error: ${await errorDelFormulario.innerText()}`;
        return "esperando";
      },
      { timeout: 45_000, message: "el login no termino" },
    )
    .toBe("fuera");

  const tenant = await login.evaluate(() => window.localStorage.getItem("nadakki_tenant_id"));
  expect(tenant, "la sesion debe ser del tenant QA; con otro tenant el test no sigue").toBe(TENANT_QA);

  // La misma sesion, en un contexto nuevo de BASE_URL. Se cierra el login antes
  // para que no rote el refresh token por su cuenta.
  const estado = await ctxLogin.storageState();
  await ctxLogin.close();
  const deLogin = estado.origins.find((o) => o.origin === new URL(origenLogin).origin);
  expect(deLogin?.localStorage.length, "el login no dejo sesion en localStorage").toBeGreaterThan(0);
  const ctx = await browser.newContext({
    baseURL: baseUrl,
    storageState:
      origenLogin === baseUrl
        ? estado
        : { cookies: [], origins: [{ origin: new URL(baseUrl).origin, localStorage: deLogin!.localStorage }] },
  });
  return ctx.newPage();
}
