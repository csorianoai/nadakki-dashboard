/**
 * UNA-VERSION (César, una sola interfaz): bank-v2 es el banco. Los roles de banco
 * aterrizan SIEMPRE en /credit-hub/bank-v2, sin interruptor. Dealers (Mapaal
 * incluido) y superadmin conservan su destino.
 */
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";
import { resolveDealerManagementRedirect } from "@/lib/dealer-management/redirect";
import type { RoleInfo } from "@/lib/api/auth-v2";

const rol = (role_key: string): RoleInfo =>
  ({ role_key, core_name: "test", display_name: role_key } as unknown as RoleInfo);
const roles = (...claves: string[]) => claves.map(rol);

const DESTINOS: Array<[string[], string]> = [
  [["platform_superadmin"], "/"],
  [["tenant_admin"], "/"],
  [["admin"], "/credit-hub/bank-v2"],
  [["sic_admin"], "/sic"],
  [["legal_admin"], "/legal-hub"],
  [["marketing_admin"], "/marketing"],
  [["credit_admin"], "/credit-hub/bank-v2"],
  [["dealer"], "/autos/dealer"],
  [["bank_analyst"], "/credit-hub/bank-v2"],
  [["banker"], "/credit-hub/bank-v2"],
  [["platform_superadmin", "banker"], "/"],
  [["dealer", "credit_admin"], "/credit-hub/bank-v2"],
  [["dealer", "banker"], "/autos/dealer"],
  [["tenant_admin", "credit_admin"], "/"],
  [["rol_que_no_existe"], "/"],
  [[], "/"],
];

const VAR = "NEXT_PUBLIC_FF_BANK_V2_DEFAULT";
const original = process.env[VAR];
afterEach(() => {
  if (original === undefined) delete process.env[VAR];
  else process.env[VAR] = original;
});

describe("destino post-login", () => {
  it.each(DESTINOS)("%j -> %s", (claves, destino) => {
    expect(getPostLoginRedirectPath(roles(...claves))).toBe(destino);
  });

  it("ningun rol aterriza en el panel anterior del banco", () => {
    for (const [claves] of DESTINOS) {
      expect(getPostLoginRedirectPath(roles(...claves))).not.toMatch(/^\/credit-hub\/bank(\/|$)/);
    }
  });

  it.each([undefined, "", "0", "1", "true"])("el antiguo interruptor (%p) ya no cambia nada", (valor) => {
    if (valor === undefined) delete process.env[VAR];
    else process.env[VAR] = valor;
    for (const [claves, destino] of DESTINOS) expect(getPostLoginRedirectPath(roles(...claves))).toBe(destino);
  });

  it("el mapeo del login deja pasar bank-v2 intacto", () => {
    expect(resolveDealerManagementRedirect(getPostLoginRedirectPath(roles("banker")))).toBe("/credit-hub/bank-v2");
  });
});
