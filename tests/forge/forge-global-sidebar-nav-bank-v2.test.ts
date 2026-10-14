/**
 * UNA-VERSION: el menu del banco enlaza bank-v2 para todos, sin interruptor, y
 * ningun enlace del menu apunta al panel anterior ni a las copias antiguas.
 */
import {
  NAV_SECTIONS,
  filterSectionsForUser,
  type NavItem,
  type NavSection,
} from "@/components/forge/layout/forge-global-sidebar-nav";
import { RUTA_V2_POR_RUTA_BANCO } from "@/lib/credit-hub/bank/panel-v2-por-defecto";
import { BANCO_V2_NAV } from "@/app/(forge)/credit-hub/bank-v2/_nav";
import type { RoleInfo } from "@/lib/api/auth-v2";

const roles = (...claves: string[]): RoleInfo[] =>
  claves.map((role_key) => ({ core_name: "credit", role_key, display_name: role_key }));

const filtrar = (r: RoleInfo[], showAdmin = false) =>
  filterSectionsForUser(NAV_SECTIONS, r, ["credit", "marketing"], showAdmin);

function hrefs(items: NavItem[]): string[] {
  return items.flatMap((i) => [...(i.href ? [i.href] : []), ...(i.children ? hrefs(i.children) : [])]);
}
const hrefsDe = (secs: NavSection[]) => secs.flatMap((s) => hrefs(s.children));
const credit = (secs: NavSection[]) => secs.find((s) => s.id === "credit-hub")!;

const VIEJAS = /^\/(credit-hub\/bank(\/|$)|credit(\/|$)|bank(\/|$)|workflow-real)/;

describe("el menu apunta a bank-v2", () => {
  it("ninguna entrada del menu apunta al panel anterior ni a las copias antiguas", () => {
    for (const h of hrefsDe(NAV_SECTIONS)) expect([h, VIEJAS.test(h)]).toEqual([h, false]);
  });

  it.each(["banker", "credit_admin", "bank_analyst"])("%s ve las 8 pantallas de bank-v2", (rol) => {
    const enlaces = hrefs(credit(filtrar(roles(rol))).children);
    const v2 = enlaces.filter((h) => h.startsWith("/credit-hub/bank-v2"));
    // Mesa, bandeja, KPIs, vehiculos, analitica, cumplimiento, auditoria y filtros.
    expect(v2).toHaveLength(8);
    const destinos = new Set(Object.values(RUTA_V2_POR_RUTA_BANCO));
    for (const h of v2) expect([h, destinos.has(h)]).toEqual([h, true]);
    // Por rol (César, 2026-10-13): el usuario de banco no ve el lado del concesionario.
    expect(enlaces.some((h) => h.startsWith("/credit-hub/dealer"))).toBe(false);
  });

  it("el lado del concesionario no se toca", () => {
    const enlaces = hrefs(credit(filtrar(roles("dealer"))).children);
    // El crédito del concesionario vive en Dealer OS (PR 2 "una sola interfaz").
    expect(enlaces).toContain("/autos/dealer/credito");
    expect(enlaces).toContain("/autos/dealer/credito/solicitudes");
    expect(enlaces.some((h) => h.includes("bank-v2"))).toBe(false);
  });

  it("ya no hay «Crédito clásico»", () => {
    expect(hrefsDe(NAV_SECTIONS)).not.toContain("/credit");
  });

  it("el antiguo interruptor no cambia el menu", () => {
    const antes = filtrar(roles("banker"), true);
    process.env.NEXT_PUBLIC_FF_BANK_V2_DEFAULT = "1";
    try {
      expect(filtrar(roles("banker"), true)).toEqual(antes);
    } finally {
      delete process.env.NEXT_PUBLIC_FF_BANK_V2_DEFAULT;
    }
  });
});

describe("el mapa no apunta a pantallas inexistentes", () => {
  it("cada destino bank-v2 es una entrada de BANCO_V2_NAV", () => {
    const v2 = new Set(BANCO_V2_NAV.flatMap((g) => g.items.map((i) => i.href)));
    for (const destino of Object.values(RUTA_V2_POR_RUTA_BANCO)) expect(v2.has(destino)).toBe(true);
  });
});
