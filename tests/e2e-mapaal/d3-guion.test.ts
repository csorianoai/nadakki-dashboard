/**
 * D3: lo que `e2e/mapaal/D3.spec.ts` busca en pantalla y en la red existe en el
 * codigo de la app, y su login es el que funciona contra mapaal.nadakki.com
 * (`iniciarSesionQA`, la regresion de D5). Si alguien renombra un testid, cambia
 * el boton o vuelve a meter price_rd/price_usd en el alta, falla aqui y no en el
 * RESULT_D3 contra el tenant QA.
 */
import { readFileSync } from "fs";
import path from "path";

import {
  VEHICLE_FORM_EMPTY,
  VEHICLE_INITIAL_STATUS,
  VEHICLE_STATUS_LABEL,
  vehicleCreatePayload,
} from "@/lib/dealer-management/vehicle-manual";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");
const spec = fuente("e2e/mapaal/D3.spec.ts");

describe("D3 guion: selectores, red y login contra el codigo de la app", () => {
  it("D3.spec.ts no hace su propio login: usa iniciarSesionQA", () => {
    expect(spec).toContain('from "./sesion-qa"');
    expect(spec).toContain("iniciarSesionQA(browser,");
    expect(spec).not.toContain("/login");
    expect(spec).not.toContain("getByPlaceholder");
  });

  it("la entrada del inventario lleva a /nuevo con el testid que busca el spec", () => {
    const lista = fuente("app/autos/dealer/inventario/page.tsx");
    expect(lista).toMatch(/href="\/autos\/dealer\/inventario\/nuevo"\s+data-testid="inventario-nuevo"/);
    expect(spec).toContain('toHaveAttribute("href", "/autos/dealer/inventario/nuevo")');
  });

  it("los testids de /nuevo existen", () => {
    const nuevo = fuente("app/autos/dealer/inventario/nuevo/page.tsx");
    const form = fuente("components/dealer-management/VehicleManualForm.tsx");
    for (const id of ["nuevo-sin-contexto", "nuevo-bloqueado"]) {
      expect(nuevo).toContain(`data-testid="${id}"`);
      expect(spec).toContain(`getByTestId("${id}")`);
    }
    for (const id of ["vehicle-manual-form", "vehicle-status", "vehicle-manual-error", "vehicle-manual-ack"]) {
      expect(form).toContain(`data-testid="${id}"`);
      expect(spec).toContain(`getByTestId("${id}")`);
    }
    expect(form).toContain('"Crear vehículo"');
    expect(spec).toContain('getByRole("button", { name: "Crear vehículo" })');
  });

  it("el alta nace en BORRADOR", () => {
    expect(VEHICLE_STATUS_LABEL[VEHICLE_INITIAL_STATUS]).toBe("BORRADOR");
    expect(spec).toContain('toHaveText("BORRADOR")');
  });

  it("la ruta del POST casa con el patron ALTA del spec", () => {
    const alta = spec.match(/const ALTA = \/(.+)\/;/);
    expect(alta).not.toBeNull();
    const patron = new RegExp(alta![1]);
    expect(fuente("lib/dealer-management/vehicle-manual.ts")).toContain(
      "/api/v1/autos/tenants/${tenant}/dealers/${dealer}/vehicles`",
    );
    expect(patron.test("/api/v1/autos/tenants/t-qa/dealers/d-qa/vehicles")).toBe(true);
    expect(patron.test("/api/v1/autos/tenants/t-qa/dealers/d-qa/vehicles/v1/photos")).toBe(false);
  });

  it("el cuerpo que afirma el spec es el que arma la app: sin price_rd, price_usd ni status", () => {
    const body = vehicleCreatePayload({ ...VEHICLE_FORM_EMPTY, make: "QA Mapaal", model: "D3", year: "2021" });
    expect(body).toMatchObject({ make: "QA Mapaal", model: "D3", year: 2021, condition: "used" });
    for (const campo of ["price_rd", "price_usd", "status"]) {
      expect(body).not.toHaveProperty(campo);
      expect(spec).toContain(`not.toHaveProperty("${campo}")`);
    }
  });
});
