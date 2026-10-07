/**
 * BANK-V2-DEFAULT 1/3 — destino post-login detras de NEXT_PUBLIC_FF_BANK_V2_DEFAULT.
 *
 * REGLA NUMERO UNO: con el interruptor apagado nada cambia para nadie. El primer
 * bloque fija la tabla completa de destinos con la variable ausente y con cada
 * valor que NO enciende. Dealers (Mapaal incluido) y superadmin no cambian
 * tampoco con el interruptor encendido.
 */
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";
import { resolveDealerManagementRedirect } from "@/lib/dealer-management/redirect";
import { aplicaPanelBancoV2 } from "@/lib/credit-hub/bank/panel-v2-por-defecto";
import { isBankV2DefaultEnabled } from "@/lib/env/feature-bank-v2-default";
import type { RoleInfo } from "@/lib/api/auth-v2";

const VAR = "NEXT_PUBLIC_FF_BANK_V2_DEFAULT";
const original = process.env[VAR];

const rol = (role_key: string): RoleInfo =>
  ({ role_key, core_name: "test", display_name: role_key } as unknown as RoleInfo);
const roles = (...claves: string[]) => claves.map(rol);

/** Destinos de hoy, antes de este cambio. Con el interruptor apagado no se mueven. */
const DESTINOS_DE_HOY: Array<[string[], string]> = [
  [["platform_superadmin"], "/"],
  [["tenant_admin"], "/"],
  [["admin"], "/credit-hub/bank"],
  [["sic_admin"], "/sic"],
  [["legal_admin"], "/legal-hub"],
  [["marketing_admin"], "/marketing"],
  [["credit_admin"], "/credit-hub/bank"],
  [["dealer"], "/autos/dealer"],
  [["bank_analyst"], "/credit-hub/bank"],
  [["banker"], "/credit-hub/bank"],
  [["platform_superadmin", "banker"], "/"],
  [["dealer", "credit_admin"], "/credit-hub/bank"],
  [["dealer", "banker"], "/autos/dealer"],
  [["tenant_admin", "credit_admin"], "/"],
  [["rol_que_no_existe"], "/"],
  [[], "/"],
];

afterEach(() => {
  if (original === undefined) delete process.env[VAR];
  else process.env[VAR] = original;
});

describe("interruptor APAGADO: nada cambia para nadie", () => {
  const apagados: Array<string | undefined> = [undefined, "", "0", "false", "off", "no", "si", "yes"];

  it.each(apagados)("valor %p no enciende el interruptor", (valor) => {
    if (valor === undefined) delete process.env[VAR];
    else process.env[VAR] = valor;
    expect(isBankV2DefaultEnabled()).toBe(false);
    for (const [claves, destino] of DESTINOS_DE_HOY) {
      expect(getPostLoginRedirectPath(roles(...claves))).toBe(destino);
      expect(aplicaPanelBancoV2(roles(...claves))).toBe(false);
    }
  });

  it("ningun rol aterriza en bank-v2", () => {
    delete process.env[VAR];
    for (const [claves] of DESTINOS_DE_HOY) {
      expect(getPostLoginRedirectPath(roles(...claves))).not.toContain("bank-v2");
    }
  });
});

describe("interruptor ENCENDIDO", () => {
  it.each(["1", "true", "on", " TRUE "])("valor %p enciende", (valor) => {
    process.env[VAR] = valor;
    expect(isBankV2DefaultEnabled()).toBe(true);
  });

  it.each(["credit_admin", "banker", "bank_analyst"])("%s aterriza en /credit-hub/bank-v2", (clave) => {
    process.env[VAR] = "1";
    expect(getPostLoginRedirectPath(roles(clave))).toBe("/credit-hub/bank-v2");
  });

  it("el mapeo del login deja pasar bank-v2 intacto", () => {
    process.env[VAR] = "1";
    expect(resolveDealerManagementRedirect(getPostLoginRedirectPath(roles("banker"))))
      .toBe("/credit-hub/bank-v2");
  });

  it("dealer, superadmin y el resto de roles conservan su destino", () => {
    process.env[VAR] = "1";
    expect(getPostLoginRedirectPath(roles("dealer"))).toBe("/autos/dealer");
    expect(getPostLoginRedirectPath(roles("platform_superadmin"))).toBe("/");
    expect(getPostLoginRedirectPath(roles("tenant_admin"))).toBe("/");
    expect(getPostLoginRedirectPath(roles("admin"))).toBe("/credit-hub/bank");
    expect(getPostLoginRedirectPath(roles("sic_admin"))).toBe("/sic");
    expect(getPostLoginRedirectPath(roles("legal_admin"))).toBe("/legal-hub");
    expect(getPostLoginRedirectPath(roles("marketing_admin"))).toBe("/marketing");
  });

  it("un superadmin con rol de banco NO cambia", () => {
    process.env[VAR] = "1";
    expect(getPostLoginRedirectPath(roles("platform_superadmin", "banker"))).toBe("/");
    expect(aplicaPanelBancoV2(roles("platform_superadmin", "banker"))).toBe(false);
  });

  it("un dealer con rol de banco NO cambia", () => {
    process.env[VAR] = "1";
    expect(getPostLoginRedirectPath(roles("dealer", "credit_admin"))).toBe("/credit-hub/bank");
    expect(getPostLoginRedirectPath(roles("dealer", "banker"))).toBe("/autos/dealer");
    expect(aplicaPanelBancoV2(roles("dealer", "credit_admin"))).toBe(false);
  });
});
