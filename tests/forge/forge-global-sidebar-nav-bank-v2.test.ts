/**
 * BANK-V2-DEFAULT 2/3 — el menu del banco enlaza bank-v2 solo con el interruptor
 * encendido y solo para usuarios de banco. Apagado: el arbol filtrado es el de
 * siempre para todos. Superadmin y dealer (Mapaal incluido): el de siempre en
 * cualquier caso.
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

const VAR = "NEXT_PUBLIC_FF_BANK_V2_DEFAULT";
const original = process.env[VAR];
afterEach(() => {
  if (original === undefined) delete process.env[VAR];
  else process.env[VAR] = original;
});

const roles = (...claves: string[]): RoleInfo[] =>
  claves.map((role_key) => ({ core_name: "credit", role_key, display_name: role_key }));

const PERFILES: Record<string, RoleInfo[]> = {
  banker: roles("banker"),
  credit_admin: roles("credit_admin"),
  bank_analyst: roles("bank_analyst"),
  admin: roles("admin"),
  dealer: roles("dealer"),
  platform_superadmin: roles("platform_superadmin"),
  tenant_admin: roles("tenant_admin"),
  "superadmin+banker": roles("platform_superadmin", "banker"),
  "dealer+credit_admin": roles("dealer", "credit_admin"),
};

const filtrar = (r: RoleInfo[], showAdmin = false) =>
  filterSectionsForUser(NAV_SECTIONS, r, ["credit", "marketing"], showAdmin);

function hrefs(items: NavItem[]): string[] {
  return items.flatMap((i) => [...(i.href ? [i.href] : []), ...(i.children ? hrefs(i.children) : [])]);
}
const hrefsDe = (secs: NavSection[]) => secs.flatMap((s) => hrefs(s.children));
const credit = (secs: NavSection[]) => secs.find((s) => s.id === "credit-hub")!;

describe("interruptor APAGADO: el menu no cambia para nadie", () => {
  it.each(Object.keys(PERFILES))("%s: ningun href nuevo, ninguno a bank-v2", (perfil) => {
    delete process.env[VAR];
    const originales = new Set(hrefsDe(NAV_SECTIONS));
    for (const showAdmin of [false, true]) {
      const salida = hrefsDe(filtrar(PERFILES[perfil], showAdmin));
      expect(salida.length).toBeGreaterThan(0);
      for (const h of salida) expect(originales.has(h)).toBe(true);
      expect(salida.some((h) => h.includes("bank-v2"))).toBe(false);
    }
  });

  it("el usuario de banco sigue viendo /credit-hub/bank", () => {
    process.env[VAR] = "0";
    expect(hrefs(credit(filtrar(PERFILES.banker)).children)).toContain("/credit-hub/bank");
  });
});

describe("interruptor ENCENDIDO", () => {
  it.each(["banker", "credit_admin", "bank_analyst"])("%s: el menu del banco apunta a bank-v2", (perfil) => {
    process.env[VAR] = "1";
    const enlaces = hrefs(credit(filtrar(PERFILES[perfil])).children);
    const existian = new Set(hrefs(credit(NAV_SECTIONS).children));
    let cambiados = 0;
    for (const [viejo, nuevo] of Object.entries(RUTA_V2_POR_RUTA_BANCO)) {
      expect(enlaces).not.toContain(viejo);
      if (existian.has(viejo)) {
        expect(enlaces).toContain(nuevo);
        cambiados++;
      }
    }
    // Mesa, bandeja, filtros, KPIs, vehiculos, analitica, cumplimiento, auditoria.
    expect(cambiados).toBe(8);
    // El lado dealer del menu no se toca.
    expect(enlaces).toContain("/credit-hub/dealer");
    expect(enlaces).toContain("/credit-hub/dealer/applications");
  });

  it("solo cambia la seccion Credit Hub y solo los href del banco", () => {
    delete process.env[VAR];
    const antes = filtrar(PERFILES.banker);
    process.env[VAR] = "1";
    const despues = filtrar(PERFILES.banker);
    expect(despues.filter((s) => s.id !== "credit-hub")).toEqual(antes.filter((s) => s.id !== "credit-hub"));
    const a = hrefs(credit(antes).children);
    const d = hrefs(credit(despues).children);
    expect(d).toEqual(a.map((h) => RUTA_V2_POR_RUTA_BANCO[h] ?? h));
  });

  it.each(["platform_superadmin", "superadmin+banker", "dealer", "dealer+credit_admin", "tenant_admin", "admin"])(
    "%s: menu identico al de siempre",
    (perfil) => {
      delete process.env[VAR];
      const antes = filtrar(PERFILES[perfil], true);
      process.env[VAR] = "1";
      expect(filtrar(PERFILES[perfil], true)).toEqual(antes);
    },
  );
});

describe("el mapa no apunta a pantallas inexistentes", () => {
  it("cada destino bank-v2 es una entrada de BANCO_V2_NAV", () => {
    const v2 = new Set(BANCO_V2_NAV.flatMap((g) => g.items.map((i) => i.href)));
    for (const destino of Object.values(RUTA_V2_POR_RUTA_BANCO)) expect(v2.has(destino)).toBe(true);
  });
});
