/**
 * "Suite operativa" solo con entitlement real del tenant.
 *
 * `hasCoreAccess` tenia DOS ramas permisivas, y la primera version de este
 * packet quito solo una. La que quedaba, `if (roleHit) return true`, dejaba que
 * un rol que nombra un core pintara el hub aunque el tenant no lo tuviera
 * suscrito: el frontend seguia concediendo visibilidad sin entitlement, por el
 * otro camino. Es el blocker
 * ROLE_HIT_CONCEDE_CORE_SIN_ENTITLEMENT_TENANT de la auditoria sobre 401254f2.
 *
 * Lo que se fija ahora: la unica autoridad es `subscribed_cores`. El rol no
 * habilita el core. Los administradores conservan su bypass explicito, que
 * `filterSectionsForUser` evalua antes de llegar aqui.
 */
import {
  ACCESS_UNVERIFIED_MESSAGE,
  NAV_SECTIONS,
  filterSectionsForUser,
  getEmptyCoreMessage,
  getEmptyCoreReason,
  isAccessUnverified,
  type RoleInfo,
} from "@/components/forge/layout/forge-global-sidebar-nav";

const CAJA: RoleInfo[] = [{ core_name: "autos", role_key: "caja" }];
const CREDIT: RoleInfo[] = [{ core_name: "credit", role_key: "credit_admin" }];
const TENANT_ADMIN: RoleInfo[] = [{ core_name: "platform", role_key: "tenant_admin" }];
const SUPER: RoleInfo[] = [{ core_name: "platform", role_key: "platform_superadmin" }];

function hubs(roles: RoleInfo[], subscribed: string[] | undefined) {
  return filterSectionsForUser(NAV_SECTIONS, roles, subscribed, false)
    .filter((section) => section.children.length > 0)
    .map((section) => section.id);
}

function creditSection() {
  const section = NAV_SECTIONS.find((item) => item.coreMatchers.includes("credit"));
  if (!section) throw new Error("no hay seccion de credit en NAV_SECTIONS");
  return section;
}

describe("el entitlement del tenant es la unica autoridad", () => {
  it("sin lista de cores suscritos no se abre ningun hub", () => {
    expect(hubs(CAJA, undefined)).toEqual([]);
  });

  it("con lista vacia tampoco: una lista vacia no es un comodin", () => {
    expect(hubs(CAJA, [])).toEqual([]);
  });

  it("con el core suscrito el hub se abre", () => {
    expect(hubs(CAJA, ["credit"])).toContain("credit-hub");
  });

  it("solo se abren los cores suscritos, no los vecinos", () => {
    const abiertos = hubs(CAJA, ["credit"]);
    expect(abiertos).toContain("credit-hub");
    expect(abiertos).not.toContain("legal-hub");
  });
});

describe("el rol no habilita el core", () => {
  it("el rol del propio core NO abre su hub si el tenant no lo tiene suscrito", () => {
    expect(hubs(CREDIT, [])).not.toContain("credit-hub");
    expect(hubs(CREDIT, undefined)).not.toContain("credit-hub");
  });

  it("sin suscripcion, tener el rol del core no cambia nada", () => {
    expect(hubs(CREDIT, [])).toEqual(hubs(CAJA, []));
  });

  it("con el core suscrito, el rol no hace falta para verlo", () => {
    expect(hubs(CAJA, ["credit"])).toContain("credit-hub");
    expect(hubs(CREDIT, ["credit"])).toContain("credit-hub");
  });
});

describe("administradores", () => {
  it("tenant_admin conserva su bypass sin depender de la lista", () => {
    expect(hubs(TENANT_ADMIN, undefined).length).toBeGreaterThan(0);
    expect(hubs(TENANT_ADMIN, undefined)).toContain("credit-hub");
  });

  it("platform_superadmin tambien", () => {
    expect(hubs(SUPER, [])).toContain("credit-hub");
  });
});

describe("motivo del hub vacio", () => {
  it("sin el core en la lista el motivo es el plan, no el rol", () => {
    expect(getEmptyCoreReason(creditSection(), CAJA, undefined, false)).toBe("plan");
    expect(getEmptyCoreReason(creditSection(), CAJA, [], false)).toBe("plan");
    expect(getEmptyCoreReason(creditSection(), CAJA, ["autos"], false)).toBe("plan");
  });

  it("tener el rol del core sin suscripcion sigue siendo un problema de plan", () => {
    expect(getEmptyCoreReason(creditSection(), CREDIT, [], false)).toBe("plan");
  });

  it("con el core suscrito, un hub vacio ya es cuestion de rol", () => {
    expect(getEmptyCoreReason(creditSection(), CAJA, ["credit"], false)).toBe("role");
  });

  it("el mensaje del plan manda al upgrade y no a pedir un rol", () => {
    expect(getEmptyCoreMessage("plan")).toContain("plan");
    expect(getEmptyCoreMessage("plan")).not.toContain("permisos");
  });
});

/**
 * Fail-closed no puede significar "menu vacio sin explicacion".
 *
 * Los permisos de Mapaal fallan hoy con `no_organization_unit`: el backend no
 * recibe la unidad organizativa, asi que la cadena BENEFICIARY deniega cerrado
 * antes de consultar nada (services/access/entitlements.py:339). Con mi version
 * anterior eso daba un menu vacio indistinguible de "tu plan no incluye nada".
 *
 * Detalle medido que importa: el backend emite estos codigos EN MINUSCULAS
 * (entitlements.py:66) y llegan dentro de un 200, como items denegados del
 * batch. `types/entitlements.ts:16` los declara en MAYUSCULAS, asi que comparar
 * contra "NO_ORGANIZATION_UNIT" no los reconoce. De ahi que la comparacion sea
 * insensible a mayusculas, y que haya un caso por cada forma.
 *
 * El reconocedor vive en `lib/access/reason-codes.ts`, no en el chrome de Forge:
 * lo consumen dos menus distintos. Aqui se importa por el reexport del modulo de
 * nav, que es lo que usa el sidebar.
 */
describe("isAccessUnverified", () => {
  it("reconoce los dos codigos tal como los emite el backend, en minusculas", () => {
    expect(isAccessUnverified("no_organization_unit")).toBe(true);
    expect(isAccessUnverified("no_beneficiary_entitlement")).toBe(true);
  });

  it("los reconoce tambien en la forma que declara types/entitlements.ts", () => {
    expect(isAccessUnverified("NO_ORGANIZATION_UNIT")).toBe(true);
    expect(isAccessUnverified("NO_BENEFICIARY_ENTITLEMENT")).toBe(true);
  });

  it("no confunde una denegacion por plan con una verificacion fallida", () => {
    for (const codigo of ["UPGRADE_REQUIRED", "NO_ACTIVE_SUBSCRIPTION", "DEFAULT_DENY", "ALLOWED"]) {
      expect(isAccessUnverified(codigo)).toBe(false);
    }
  });

  it("sin codigo no inventa un fallo de verificacion", () => {
    expect(isAccessUnverified(null)).toBe(false);
    expect(isAccessUnverified(undefined)).toBe(false);
    expect(isAccessUnverified("   ")).toBe(false);
  });
});

describe("motivo del hub vacio cuando el acceso no se pudo verificar", () => {
  it("gana a cualquier otra lectura: no se afirma nada sobre el plan", () => {
    expect(getEmptyCoreReason(creditSection(), CAJA, undefined, false, "no_organization_unit")).toBe("unverified");
    expect(getEmptyCoreReason(creditSection(), CAJA, [], false, "no_beneficiary_entitlement")).toBe("unverified");
  });

  it("tambien cuando el core SI esta suscrito: el problema no es el plan", () => {
    expect(getEmptyCoreReason(creditSection(), CAJA, ["credit"], false, "no_organization_unit")).toBe("unverified");
  });

  it("y tambien en la seccion admin, que antes siempre decia rol", () => {
    const admin = NAV_SECTIONS.find((item) => item.id === "admin")!;
    expect(getEmptyCoreReason(admin, CAJA, [], false, "no_organization_unit")).toBe("unverified");
  });

  it("con un codigo que si es de plan se sigue diciendo plan", () => {
    expect(getEmptyCoreReason(creditSection(), CAJA, [], false, "UPGRADE_REQUIRED")).toBe("plan");
  });

  it("sin codigo de acceso nada cambia respecto de antes", () => {
    expect(getEmptyCoreReason(creditSection(), CAJA, [], false)).toBe("plan");
    expect(getEmptyCoreReason(creditSection(), CAJA, ["credit"], false)).toBe("role");
  });

  it("el mensaje dice que no se pudo comprobar, no que falte el modulo", () => {
    const copia = getEmptyCoreMessage("unverified");
    expect(copia).toContain(ACCESS_UNVERIFIED_MESSAGE);
    expect(copia).not.toContain("plan");
    expect(copia).not.toContain("permisos");
  });

  it("la frase es la pedida, palabra por palabra", () => {
    expect(ACCESS_UNVERIFIED_MESSAGE).toBe("No se pudieron verificar tus accesos");
  });
});
