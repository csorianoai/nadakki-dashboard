/**
 * Registro de módulos (PR 6a): ocho módulos, prefijos sin ambigüedad, menús DERIVADOS de las fuentes existentes
 * (nunca copiados), moduloDeRuta, y visibilidad idéntica a la del menú lateral de la Suite (mismo filtro).
 */
import { NAV_SECTIONS, filterSectionsForUser, userCanAccessAdminNav } from "@/components/forge/layout/forge-global-sidebar-nav";
import { DEALER_NAV_GROUPS, isDealerNavItemOpenable } from "@/components/dealer-management/shell/dealer-nav";
import type { RoleInfo } from "@/lib/api/auth-v2";
import { MODULOS, itemActivo, menuVisible, moduloDeRuta, modulosVisibles, sinQuery, usaCarcasaComun } from "@/lib/modulos/registro";
import { NAVEGACION, PESTANAS_MARKETING } from "@/lib/navigation";
import { REALTOR_CENTERS } from "@/lib/realtor/centers";

const rol = (role_key: string, core_name = "credit"): RoleInfo => ({ core_name, role_key, display_name: role_key });
const TODOS = ["autos", "credit", "marketing", "accounting", "legal", "projects", "sic", "platform"];

const hrefs = (m: (typeof MODULOS)[number]) => m.menu.flatMap((g) => g.items.filter((i) => i.href).map((i) => i.href));
/** Filas «Pronto» (sin enlace): su ruta aprobada también debe caer en el módulo. */
const pronto = (m: (typeof MODULOS)[number]) => m.menu.flatMap((g) => g.items.filter((i) => i.pronto).map((i) => i.pronto as string));
const bajo = (r: string, p: string) => r === p || r.startsWith(`${p}/`);
const modulo = (id: string) => MODULOS.find((m) => m.id === id)!;

describe("(1) los ocho módulos", () => {
  test("son ocho, con ids únicos y los esperados", () => {
    expect(MODULOS.map((m) => m.id)).toEqual(["concesionarios", "credito", "marketing", "contabilidad", "legal", "proyectos", "real-estate", "administracion"]);
    expect(new Set(MODULOS.map((m) => m.id)).size).toBe(8);
    for (const m of MODULOS) {
      expect(m.label).toBeTruthy();
      expect(m.icono).toBeTruthy();
      expect(m.menu.length).toBeGreaterThan(0);
      expect(bajo(sinQuery(m.raiz), m.prefijos.find((p) => bajo(sinQuery(m.raiz), p)) ?? "\0")).toBe(true);
    }
  });

  test("los ids de los items son únicos dentro del módulo", () => {
    for (const m of MODULOS) {
      const ids = m.menu.flatMap((g) => g.items.map((i) => i.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test("prefijos sin solapamiento ambiguo: ninguno repetido ni anidado entre módulos distintos", () => {
    for (const a of MODULOS) {
      for (const b of MODULOS) {
        if (a.id === b.id) continue;
        for (const pa of a.prefijos) for (const pb of b.prefijos) expect([a.id, b.id, pa, pb, bajo(pa, pb) || bajo(pb, pa)]).toEqual([a.id, b.id, pa, pb, false]);
      }
    }
  });

  test("cada href del menú pertenece al prefijo de su módulo o a una ruta compartida declarada", () => {
    for (const m of MODULOS) {
      for (const h of hrefs(m)) {
        const ruta = sinQuery(h);
        const propio = moduloDeRuta(ruta)?.id === m.id;
        const compartida = (m.compartidas ?? []).some((p) => bajo(ruta, p));
        expect([m.id, h, propio || compartida]).toEqual([m.id, h, true]);
      }
      for (const h of pronto(m)) expect([m.id, h, moduloDeRuta(sinQuery(h))?.id === m.id]).toEqual([m.id, h, true]);
    }
    expect(modulo("credito").compartidas).toEqual(["/autos/dealer/credito"]);
  });
});

describe("(2) el menú se DERIVA, no se copia", () => {
  const deSeccion = (m: string, s: string) => expect(new Set(hrefs(modulo(m)))).toEqual(new Set(NAVEGACION.find((x) => x.id === s)!.children.filter((c) => c.href).map((c) => c.href)));
  test.each([["credito", "credit-hub"], ["contabilidad", "contable-hub"], ["legal", "legal-hub"], ["proyectos", "projects-hub"], ["administracion", "admin"]])("%s sale de la sección %s de lib/navigation.ts", deSeccion);

  test("Marketing sale de las pestañas; Dealer OS de DEALER_NAV_GROUPS; Real Estate de sus centros", () => {
    expect(hrefs(modulo("marketing"))).toEqual(PESTANAS_MARKETING.flatMap((p) => p.paginas.map((g) => g.href)));
    // PS-9-CARCASAS-2: con la MISMA regla que el menú propio del dealer (visibleDealerNavGroups): solo lo que se abre desde el panel.
    expect(hrefs(modulo("concesionarios"))).toEqual(DEALER_NAV_GROUPS.flatMap((g) => g.items.filter((i) => isDealerNavItemOpenable(i.href)).map((i) => i.href)));
    const centros = REALTOR_CENTERS.filter((c) => c.href).map((c) => c.href);
    for (const c of centros) expect(hrefs(modulo("real-estate"))).toContain(c);
  });

  test("bank-v2 y Cockpit quedan expuestos como carcasas del registro", () => {
    expect(modulo("credito").carcasas?.some((c) => c.prefijos.includes("/credit-hub/bank-v2"))).toBe(true);
    expect(modulo("administracion").carcasas?.some((c) => c.prefijos.includes("/cockpit"))).toBe(true);
    expect(modulo("real-estate").carcasa).toBe("propia");
  });
});

describe("(3) moduloDeRuta: gana el prefijo más largo", () => {
  test.each([
    ["/legal", "legal"], ["/legal/cases/ab12", "legal"], ["/proyectos/portafolio", "proyectos"],
    ["/marketing/campaigns?x=1", "marketing"], ["/workflows", "marketing"], ["/social/inbox", "marketing"],
    ["/admin/gates", "administracion"], ["/settings/integrations", "administracion"], ["/cockpit", "administracion"],
    ["/realtor/clientes", "real-estate"], ["/contable/resumen", "contabilidad"],
    ["/autos/dealer/credito/solicitudes", "concesionarios"], ["/autos/dealer", "concesionarios"],
    ["/credit-hub/bank-v2/solicitudes", "credito"], ["/sic/bandeja", "credito"], ["/credit/new", "credito"],
  ])("%s -> %s", (ruta, id) => expect(moduloDeRuta(ruta)?.id).toBe(id));

  test("por segmento: una ruta que solo empieza por la palabra no cuenta; rutas sueltas no tienen módulo", () => {
    for (const r of ["/", "/legalx", "/realtors", "/notifications", "/agents", "/ruta/que/nadie/conoce"]) expect(moduloDeRuta(r)).toBeNull();
  });

  test("qué rutas usan ModuleShell", () => {
    for (const r of ["/marketing/campaigns", "/legal/cases", "/proyectos", "/admin", "/settings", "/autos/dealer", "/centro-operativo"]) expect(usaCarcasaComun(r)).toBe(true);   // dealer: PS-9-CARCASAS-2
    for (const r of ["/", "/cockpit", "/credit-hub/bank-v2", "/sic", "/realtor", "/contable/resumen", "/agents"]) expect(usaCarcasaComun(r)).toBe(false);
  });

  test("item activo: el de href más específico", () => {
    const legal = modulo("legal").menu;
    expect(itemActivo(legal, "/legal/cases/new")?.id).toBe("legal-cases-new");
    expect(itemActivo(legal, "/legal/cases/abc")?.id).toBe("legal-cases");
    expect(itemActivo(legal, "/legal")?.id).toBe("legal-home");
    expect(itemActivo(legal, "/otra")).toBeNull();
  });
});

describe("(4) visibilidad: el mismo filtro que el menú lateral de la Suite", () => {
  const CASOS: [string, RoleInfo[], string[] | undefined, boolean][] = [
    ["superadmin", [rol("platform_superadmin", "platform")], [], false],
    ["tenant_admin con todo", [rol("tenant_admin")], TODOS, false],
    ["analista de banco, solo crédito", [rol("bank_analyst")], ["credit"], false],
    ["dealer con autos y crédito", [rol("dealer")], ["autos", "credit"], false],
    ["marketing y legal", [rol("marketer", "marketing")], ["marketing", "legal"], false],
    ["sin módulos", [rol("banker")], [], false],
    ["tenant sin lista", [rol("banker")], undefined, false],
    ["con Real Estate", [rol("tenant_admin")], ["projects"], true],
  ];
  test.each(CASOS)("%s", (_n, roles, cores, realtorOk) => {
    const admin = userCanAccessAdminNav(roles);
    const esperado = filterSectionsForUser(NAV_SECTIONS, roles, cores, admin)
      .filter((s) => s.acceso !== "realtor" || realtorOk)
      .map((s) => s.id)
      .filter((id) => MODULOS.some((m) => m.seccion === id));
    expect(modulosVisibles({ roles, subscribedCores: cores, realtorOk }).map((m) => m.seccion)).toEqual(esperado);
  });

  test("Real Estate solo con el 200 de /acceso; Administración solo para administradores", () => {
    const ids = (r: RoleInfo[], realtorOk: boolean) => modulosVisibles({ roles: r, subscribedCores: TODOS, realtorOk }).map((m) => m.id);
    expect(ids([rol("dealer")], false)).not.toContain("real-estate");
    expect(ids([rol("dealer")], true)).toContain("real-estate");
    expect(ids([rol("dealer")], true)).not.toContain("administracion");
    expect(ids([rol("tenant_admin")], false)).toContain("administracion");
  });

  test("el menú del módulo se filtra por rol como el de la Suite (banco ≠ concesionario)", () => {
    const credito = modulo("credito");
    const enlaces = (r: RoleInfo[]) => menuVisible(credito, { roles: r, subscribedCores: ["credit"] }).flatMap((g) => g.items.map((i) => i.href));
    expect(enlaces([rol("bank_analyst")])).toContain("/credit-hub/bank-v2/solicitudes");
    expect(enlaces([rol("bank_analyst")]).some((h) => h.startsWith("/autos/dealer/credito"))).toBe(false);
    expect(enlaces([rol("dealer")])).toContain("/autos/dealer/credito/solicitudes");
    expect(enlaces([rol("dealer")]).some((h) => h.startsWith("/credit-hub/bank-v2"))).toBe(false);
    const seccion = filterSectionsForUser(NAV_SECTIONS, [rol("dealer")], ["credit"], false).find((s) => s.id === "credit-hub")!;
    expect([...enlaces([rol("dealer")])].sort()).toEqual(seccion.children.map((c) => c.href as string).sort());
  });

  test("sin el módulo en el tenant, el menú del módulo queda vacío", () => {
    expect(menuVisible(modulo("legal"), { roles: [rol("banker")], subscribedCores: ["credit"] })).toEqual([]);
    expect(menuVisible(modulo("legal"), { roles: [rol("banker")], subscribedCores: ["legal"] }).length).toBeGreaterThan(0);
  });
});
