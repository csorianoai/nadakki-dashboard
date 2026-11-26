/**
 * EQUIPO-DEALER: un vendedor, gerente o contador invitado por el dueno del concesionario solo trae su rol del core
 * autos. Sin entrada en el mapa aterrizaba en "/"; ahora entra al panel del concesionario como el rol `dealer`.
 */
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";
import type { RoleInfo } from "@/lib/api/auth-v2";

const rol = (role_key: string): RoleInfo =>
  ({ role_key, core_name: "autos", display_name: role_key } as unknown as RoleInfo);

describe("aterrizaje del equipo del concesionario", () => {
  it.each(["dealer_vendedor", "dealer_gerente", "dealer_contador"])("%s entra a /autos/dealer", (r) => {
    expect(getPostLoginRedirectPath([rol(r)])).toBe("/autos/dealer");
  });

  it("no cambia la prioridad de los roles que ya existian", () => {
    expect(getPostLoginRedirectPath([rol("dealer_gerente"), rol("tenant_admin")])).toBe("/");
    expect(getPostLoginRedirectPath([rol("dealer_vendedor"), rol("dealer")])).toBe("/autos/dealer");
    expect(getPostLoginRedirectPath([rol("rol_desconocido")])).toBe("/");
  });
});
