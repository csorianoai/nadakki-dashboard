import type { Page } from "@playwright/test";

const B = "http://backend.invalid";

/**
 * Sesión simulada de los e2e de Realtor: refresh y me de auth v2, tenant con el core real_estate y /acceso con el
 * código pedido. Desde el aviso de tenant DEMO, las pantallas solo pintan DEMO si el build lo permite
 * (NEXT_PUBLIC_REALTOR_ALLOW_DEMO=1) Y /acceso trae `demo: true`; por eso el 200 lleva `demo: true` salvo que se
 * pida lo contrario. En el servidor sin DEMO (3101) el mismo `demo: true` comprueba que el build lo sigue cerrando.
 * `roles` va en el 200 de /acceso; `vistas` recibe cada petición a /acceso (URL, cuerpo y cabeceras) para comprobar
 * que el cliente nunca manda tenant.
 */
export async function sesion(
  page: Page,
  acceso: number,
  { demo = true, roles = [], vistas }: { demo?: boolean; roles?: string[]; vistas?: string[] } = {},
) {
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
  await page.route(/\/api\/v1\/realestate\/acceso/, (route) => {
    vistas?.push(`${route.request().url()} ${route.request().postData() ?? ""} ${JSON.stringify(route.request().headers())}`);
    return route.fulfill({ status: acceso, json: acceso === 200 ? { ok: true, roles, demo } : { detail: "forbidden" } });
  });
  await page.addInitScript(() => localStorage.setItem("nadakki_refresh_token_v2", "r"));
}
