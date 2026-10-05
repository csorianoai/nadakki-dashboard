/**
 * Regresion del RESULT_D5=FAIL en 9bd7f070: el spec tomaba el primer enlace
 * `/autos/dealer/inventario/*`, que es el boton "Nuevo vehiculo" (`/nuevo`), y
 * abria el formulario de alta: `vehicle-photos` no existe ahi y esperaba 60 s.
 */
import { readFileSync } from "fs";
import path from "path";

import { SELECTOR_VEHICULO, idPrimerVehiculo } from "../../e2e/mapaal/d5-vehiculo";

const raiz = path.resolve(__dirname, "../..");

describe("D5: el vehiculo de prueba no es la pantalla de alta", () => {
  it("salta /nuevo aunque vaya antes que las filas", () => {
    const hrefs = ["/autos/dealer/inventario/nuevo", "/autos/dealer/inventario/veh%2F1", "/autos/dealer/inventario/b"];
    expect(idPrimerVehiculo(hrefs)).toBe("veh/1");
  });

  it("sin vehiculos devuelve vacio, no 'nuevo'", () => {
    expect(idPrimerVehiculo(["/autos/dealer/inventario/nuevo", "/autos/dealer/inventario", "/otra"])).toBe("");
  });

  it("el selector excluye /nuevo", () => {
    expect(SELECTOR_VEHICULO).toContain(':not([href="/autos/dealer/inventario/nuevo"])');
  });

  it("D5.spec.ts usa el selector y no un a[href^=...] pelado", () => {
    const spec = readFileSync(path.join(raiz, "e2e/mapaal/D5.spec.ts"), "utf8");
    expect(spec).toContain("SELECTOR_VEHICULO");
    expect(spec).not.toContain("a[href^=");
  });
});
