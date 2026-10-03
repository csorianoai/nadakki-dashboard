/**
 * El Centro Operativo se pinta con el chrome del dealer, no con el de Forge (D9).
 *
 * Decision de Cesar. Antes caia en la rama por defecto de `AppGate` y lo
 * envolvia `GlobalForgeAppShell` --la barra "Suite operativa" con todos los
 * hubs--, asi que un dealer que pulsaba "Empezar: cargar mi stock" en su Inicio
 * cambiaba de mundo y perdia el menu desde el que venia.
 *
 * Hacen falta DOS piezas y aqui se fijan las dos:
 *   1. `isDealerChromePath`, que saca la ruta de la rama de Forge.
 *   2. `app/centro-operativo/layout.tsx`, que pone el `DealerShell`.
 * Con una sola se verian dos navegaciones apiladas, que es el defecto que el
 * shell unico del dealer vino a quitar.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CENTRO_OPERATIVO_ROOT,
  isDealerChromePath,
  isDealerManagementPath,
} from "@/lib/autos-portal/routes";

describe("isDealerChromePath", () => {
  test("el Centro Operativo lleva chrome de dealer", () => {
    expect(isDealerChromePath(CENTRO_OPERATIVO_ROOT)).toBe(true);
    expect(isDealerChromePath("/centro-operativo")).toBe(true);
  });

  test("sigue cubriendo el panel del dealer", () => {
    expect(isDealerChromePath("/autos/dealer")).toBe(true);
    expect(isDealerChromePath("/autos/dealer/inventario")).toBe(true);
  });

  test("no se lleva por delante otras rutas", () => {
    expect(isDealerChromePath("/contable")).toBe(false);
    expect(isDealerChromePath("/autos/vehiculos")).toBe(false);
    expect(isDealerChromePath("/credit-hub/dealer")).toBe(false);
    // Un prefijo parecido no cuenta.
    expect(isDealerChromePath("/centro-operativo-viejo")).toBe(false);
    expect(isDealerChromePath(null)).toBe(false);
  });

  test("isDealerManagementPath NO cambia de significado", () => {
    // Sigue siendo "el panel privado bajo /autos/dealer". El Centro Operativo
    // comparte el chrome, no la raiz.
    expect(isDealerManagementPath("/centro-operativo")).toBe(false);
    expect(isDealerManagementPath("/autos/dealer")).toBe(true);
  });
});

describe("el cableado del chrome", () => {
  test("AppGate enruta por isDealerChromePath y ya no por isDealerManagementPath", () => {
    const src = readFileSync(join(process.cwd(), "components", "auth", "AppGate.tsx"), "utf-8");
    expect(src).toContain("isDealerChromePath");
    // Si volviera a la funcion vieja, el Centro Operativo recaeria en Forge.
    expect(src).not.toContain("isDealerManagementPath");
  });

  test("la barra del marketplace tampoco se apila encima", () => {
    const src = readFileSync(join(process.cwd(), "components", "nav", "TopNav.tsx"), "utf-8");
    expect(src).toContain("isDealerChromePath");
  });

  test("el layout del Centro Operativo monta DealerShell", () => {
    const layout = join(process.cwd(), "app", "centro-operativo", "layout.tsx");
    expect(existsSync(layout)).toBe(true);
    const src = readFileSync(layout, "utf-8");
    expect(src).toContain("DealerShell");
  });
});
