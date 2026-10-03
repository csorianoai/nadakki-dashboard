/**
 * El Centro Operativo en el menu del dealer, grupo Operacion (D9).
 *
 * Es el sitio del onboarding de Mapaal (decision de Cesar), asi que tiene que
 * llegarse desde el menu y no solo escribiendo la URL.
 *
 * Lo que se fija aqui:
 *
 *  - Esta en el grupo OPERACION, que es donde lo pidio Cesar.
 *  - `capability: null`, o sea siempre visible. La guia no publica ningun dato
 *    del tenant y es justo lo que necesita un dealer que todavia no tiene plan
 *    ni stock; cerrarla por plan dejaria sin instrucciones a quien mas las
 *    necesita. Por eso tampoco entra en el batch de entitlements.
 *  - La ruta EXISTE. Un item de menu hacia un 404 es peor que no tener el item.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  DEALER_NAV_CAPABILITY_KEYS,
  DEALER_NAV_GROUPS,
  isDealerNavItemActive,
} from "@/components/dealer-management/shell/dealer-nav";

const OPERACION = DEALER_NAV_GROUPS.find((group) => group.id === "operacion")!;
const CENTRO = OPERACION.items.find((entry) => entry.href === "/centro-operativo");

describe("Centro Operativo en el grupo Operacion", () => {
  test("el grupo se llama Operacion y contiene el enlace", () => {
    expect(OPERACION.label).toBe("Operación");
    expect(CENTRO).toBeDefined();
    expect(CENTRO!.label).toBe("Centro Operativo");
  });

  test("siempre visible: no depende del plan", () => {
    expect(CENTRO!.capability).toBeNull();
    expect(DEALER_NAV_CAPABILITY_KEYS).not.toContain("/centro-operativo");
  });

  test("la ruta existe en el arbol de app/", () => {
    const page = join(process.cwd(), "app", "centro-operativo", "page.tsx");
    expect(existsSync(page)).toBe(true);
  });

  test("se marca activo tambien en el ancla de primeros pasos", () => {
    expect(isDealerNavItemActive("/centro-operativo", "/centro-operativo")).toBe(true);
    // El ancla no cambia el pathname, pero dejamos fijado que el prefijo manda.
    expect(isDealerNavItemActive("/centro-operativo", "/centro-operativo/algo")).toBe(true);
    expect(isDealerNavItemActive("/centro-operativo", "/autos/dealer")).toBe(false);
  });
});

describe("la pantalla deja enlazable la seccion de primeros pasos", () => {
  test("cada bloque de la guia lleva su propio id", () => {
    const src = require("node:fs").readFileSync(
      join(process.cwd(), "app", "centro-operativo", "page.tsx"),
      "utf-8",
    ) as string;
    // Sin `id` el boton "Empezar: cargar mi stock" aterrizaria al principio de
    // la guia en vez de en los primeros pasos.
    expect(src).toMatch(/id=\{bloque\.id\}/);
  });
});
