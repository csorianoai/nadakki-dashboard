/**
 * DEALER-LANDING-01 — el rol dealer aterriza en su producto.
 *
 * EL DEFECTO: `POST_LOGIN_REDIRECT_BY_ROLE` mandaba `dealer` a
 * `/credit-hub/dealer`. El destino correcto se conseguia con un mapeo aparte
 * (`lib/dealer-management/redirect.ts`) aplicado SOLO en los dos `router.push` de
 * `app/(auth)/login/page.tsx`. Medido: `lib/cockpit/tenant-home.ts:6` llama a
 * `getPostLoginRedirectPath` SIN ese mapeo, y de ahi cuelgan `CockpitSidebar` y
 * `CockpitUserMenu` — o sea que el "inicio" de un dealer en el Cockpit apuntaba a
 * `/credit-hub/dealer`. Este fichero prueba la FUENTE, no el parche.
 *
 * Este fichero prueba una funcion pura, asi que no declara
 * `@jest-environment`: se apoya en el `testEnvironment` de `jest.config.js`.
 */
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";
import { resolveDealerManagementRedirect } from "@/lib/dealer-management/redirect";
import type { RoleInfo } from "@/lib/api/auth-v2";

const rol = (role_key: string): RoleInfo =>
  ({ role_key, core_name: "test", display_name: role_key } as unknown as RoleInfo);

describe("getPostLoginRedirectPath", () => {
  it("manda al dealer a /autos/dealer", () => {
    expect(getPostLoginRedirectPath([rol("dealer")])).toBe("/autos/dealer");
  });

  it("no manda al dealer a credit-hub", () => {
    // El defecto, en una linea: cualquier destino bajo credit-hub para un dealer
    // es el bug que este packet cierra.
    expect(getPostLoginRedirectPath([rol("dealer")])).not.toContain("credit-hub");
  });

  it("los usuarios de banco conservan su destino", () => {
    for (const clave of ["admin", "credit_admin", "bank_analyst", "banker"]) {
      expect(getPostLoginRedirectPath([rol(clave)])).toBe("/credit-hub/bank");
    }
  });

  it("platform_superadmin conserva su destino", () => {
    expect(getPostLoginRedirectPath([rol("platform_superadmin")])).toBe("/");
  });

  it("el resto de los roles conserva su destino", () => {
    expect(getPostLoginRedirectPath([rol("tenant_admin")])).toBe("/");
    expect(getPostLoginRedirectPath([rol("sic_admin")])).toBe("/sic");
    expect(getPostLoginRedirectPath([rol("legal_admin")])).toBe("/legal-hub");
    expect(getPostLoginRedirectPath([rol("marketing_admin")])).toBe("/marketing");
  });

  it("la prioridad de roles no cambia: platform_superadmin gana sobre dealer", () => {
    // Un usuario con los dos roles NO debe caer en el dealer. Si el orden se
    // rompiera, un superadmin aterrizaria en el producto de un dealer.
    expect(getPostLoginRedirectPath([rol("dealer"), rol("platform_superadmin")]))
      .toBe("/");
  });

  it("un rol desconocido cae en la raiz", () => {
    expect(getPostLoginRedirectPath([rol("rol_que_no_existe")])).toBe("/");
    expect(getPostLoginRedirectPath([])).toBe("/");
  });
});

describe("el mapeo aparte queda como no-op, no como segunda fuente", () => {
  it("resolveDealerManagementRedirect ya no tiene nada que corregir", () => {
    // El destino que ahora emite la fuente pasa intacto por el mapeo.
    expect(resolveDealerManagementRedirect(getPostLoginRedirectPath([rol("dealer")])))
      .toBe("/autos/dealer");
    // Y los destinos de banco y plataforma siguen intactos.
    expect(resolveDealerManagementRedirect("/credit-hub/bank")).toBe("/credit-hub/bank");
    expect(resolveDealerManagementRedirect("/")).toBe("/");
  });
});
