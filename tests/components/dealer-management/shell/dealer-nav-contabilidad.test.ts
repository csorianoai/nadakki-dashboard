/**
 * Contabilidad en el menu del dealer: plan de cuentas, libro mayor y balance.
 *
 * Medido en produccion con cajamapaal: no hay contabilidad en el menu del
 * dealer. El menu traia "Contabilidad" apuntando a /contable y "Estados
 * financieros", pero las tres pantallas que el dealer necesita --plan de
 * cuentas, mayor y balance-- existen en app/contable y no estaban enlazadas
 * desde el panel, asi que solo se llegaba a ellas escribiendo la URL.
 *
 * Tambien se fija que cada enlace nuevo apunte a una ruta que EXISTE: un item de
 * menu hacia un 404 es peor que no tener el item, y es justo el defecto que
 * tenia /autos/dealer/finanzas.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  DEALER_NAV_CAPABILITY_KEYS,
  DEALER_NAV_GROUPS,
  dealerBreadcrumbFor,
} from "@/components/dealer-management/shell/dealer-nav";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

const FINANZAS = DEALER_NAV_GROUPS.find((group) => group.id === "finanzas")!;

function item(href: string) {
  return FINANZAS.items.find((entry) => entry.href === href);
}

describe("grupo Finanzas", () => {
  it("enlaza plan de cuentas, libro mayor y balance", () => {
    expect(item("/contable/plan-cuentas")?.label).toBe("Plan de cuentas");
    expect(item("/contable/libro-mayor")?.label).toBe("Libro mayor");
    expect(item("/contable/balance-comprobacion")?.label).toBe("Balance");
  });

  it("cada uno pide una capability del catalogo 097", () => {
    for (const href of ["/contable/plan-cuentas", "/contable/libro-mayor", "/contable/balance-comprobacion"]) {
      const capability = item(href)?.capability;
      expect(typeof capability).toBe("string");
      expect(MIGRATION_097_CAPABILITY_KEYS.has(capability as string)).toBe(true);
    }
  });

  it("el mayor y el plan van con la clave del mayor; el balance con la de reportes", () => {
    expect(item("/contable/plan-cuentas")?.capability).toBe("accounting.ledger.entries");
    expect(item("/contable/libro-mayor")?.capability).toBe("accounting.ledger.entries");
    expect(item("/contable/balance-comprobacion")?.capability).toBe("accounting.reports.financial");
  });

  it("no introduce claves nuevas en el batch", () => {
    expect(DEALER_NAV_CAPABILITY_KEYS).toEqual([...new Set(DEALER_NAV_CAPABILITY_KEYS)]);
    for (const key of DEALER_NAV_CAPABILITY_KEYS) {
      expect(MIGRATION_097_CAPABILITY_KEYS.has(key)).toBe(true);
    }
  });
});

/**
 * Un item de menu hacia un 404 es peor que no tener el item, y es justo lo que
 * pasaba con /autos/dealer/finanzas. Aqui se mide contra el arbol de rutas real.
 *
 * `PENDIENTES` es la lista EXPLICITA de enlaces cuya pantalla llega en otro
 * packet. Se escribe como un subconjunto permitido, no como una igualdad, para
 * que el caso siga verde cuando esas pantallas aterricen --y para que cualquier
 * enlace nuevo a una ruta inexistente caiga aqui.
 */
const PENDIENTES = new Set([
  // DASH-VEHICLE-COSTS-SCREEN-01: pantalla de finanzas por vehiculo.
  "/autos/dealer/finanzas",
]);

function hrefSinPantalla(href: string): boolean {
  if (href.includes("[")) return false;
  const segments = href.replace(/^\//, "");
  return ![
    join(process.cwd(), "app", segments, "page.tsx"),
    join(process.cwd(), "app", "(forge)", segments, "page.tsx"),
  ].some((ruta) => existsSync(ruta));
}

describe("ningun enlace del menu apunta a un 404", () => {
  it("los enlaces de contabilidad tienen su pantalla", () => {
    for (const href of [
      "/contable",
      "/contable/plan-cuentas",
      "/contable/libro-mayor",
      "/contable/balance-comprobacion",
      "/contable/estado-resultados",
    ]) {
      expect(hrefSinPantalla(href)).toBe(false);
    }
  });

  it("no hay enlaces sin pantalla fuera de los pendientes declarados", () => {
    const faltan = DEALER_NAV_GROUPS.flatMap((group) => group.items)
      .map((entry) => entry.href)
      .filter(hrefSinPantalla)
      .filter((href) => !PENDIENTES.has(href));
    expect(faltan).toEqual([]);
  });
});

describe("migas", () => {
  it("el mayor usa su propio item y no el de Contabilidad", () => {
    expect(dealerBreadcrumbFor("/contable/libro-mayor")).toEqual([
      { label: "Inicio", href: "/autos/dealer" },
      { label: "Libro mayor", href: "/contable/libro-mayor" },
    ]);
  });
});
