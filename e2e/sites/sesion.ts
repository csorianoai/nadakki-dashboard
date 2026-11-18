import type { Page } from "@playwright/test";

const B = "http://backend.invalid";
export const NODEMO = "http://127.0.0.1:3121";
export const SITE = "00000000-0000-4000-8000-0000000000b1";

export const RUTAS = ["/mi-web", "/mi-web/paginas", "/mi-web/propiedades", "/mi-web/medios", "/mi-web/desarrollos", "/mi-web/publicar", "/mi-web/vista-previa"] as const;

/** caida = 503 en toda /api/v1/sites; vacia = lista sin sitios; ajeno = el sitio existe en la lista pero su contenido da 404 NOT_FOUND. */
export type Api = "caida" | "ajeno";

/** Sesion simulada (auth v2) e intercepcion de /api/**: ninguna peticion sale a un backend real. Devuelve las URL pedidas a sites. */
export async function sesion(page: Page, api: Api = "caida"): Promise<string[]> {
  const vistas: string[] = [];
  await page.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/**`, (route) => route.fulfill({ json: {} }));
  await page.route(`${B}/api/v2/auth/refresh`, (route) =>
    route.fulfill({ json: { access_token: "a.b.c", refresh_token: "r", expires_in: 3600 } }));
  const tenant = { id: "t1", slug: "qa", display_name: "QA", subscribed_cores: ["real_estate"] };
  await page.route(`${B}/api/v2/auth/me`, (route) =>
    route.fulfill({ json: {
      user: { id: "u1", email: "qa@nadakki.test", name: "QA", is_active: true, mfa_enabled: false },
      current_tenant: tenant, all_tenants: [tenant], active_roles: [],
    } }));
  await page.route(/\/api\/v1\/sites/, (route) => {
    const u = new URL(route.request().url());
    vistas.push(u.pathname + u.search);
    if (api === "ajeno") {
      if (u.pathname === "/api/v1/sites/sites") {
        return route.fulfill({ json: { items: [{ id: SITE, vertical: "realestate", name: { es: "Sitio" }, status: "draft", content_version: 0 }], next_cursor: null } });
      }
      return route.fulfill({ status: 404, json: { code: "NOT_FOUND", message: "no existe" } });
    }
    return route.fulfill({ status: 503, json: { code: "UNAVAILABLE", message: "caido" } });
  });
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
  return vistas;
}
