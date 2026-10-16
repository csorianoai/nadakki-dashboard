/** @jest-environment node */
/**
 * Regresión O3-D-BROKER: /realtor/broker se clasificó dos veces (un PR de la pantalla y otro de DASH-NAV) y el
 * manifiesto quedó con la ruta repetida o sin ella según el orden de fusión. Debe haber exactamente una entrada
 * `menu`, y su href debe existir en lib/realtor/menu.ts.
 */
import fs from "fs";
import path from "path";
import { MANIFIESTO_PAGINAS } from "@/lib/paginas/manifiesto";

const RAIZ = path.resolve(__dirname, "..", "..");

describe("manifiesto: /realtor/broker", () => {
  const entradas = MANIFIESTO_PAGINAS.filter((e) => e.ruta === "/realtor/broker");

  it("existe la página y está clasificada exactamente una vez", () => {
    expect(fs.existsSync(path.join(RAIZ, "app/realtor/broker/page.tsx"))).toBe(true);
    expect(entradas).toHaveLength(1);
  });

  it("es categoría menu y el href está en el menú de Realtor", () => {
    expect(entradas[0]?.categoria).toBe("menu");
    expect(fs.readFileSync(path.join(RAIZ, "lib/realtor/menu.ts"), "utf8")).toContain('"/realtor/broker"');
  });
});
