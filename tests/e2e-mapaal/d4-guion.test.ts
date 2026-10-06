/**
 * D4: lo que `e2e/mapaal/D4.spec.ts` busca en pantalla y en la red existe en el
 * codigo de la app, y su login es `iniciarSesionQA`. Si alguien renombra un
 * testid, un campo o una regla contable, falla aqui y no en el RESULT_D4
 * contra el tenant QA.
 */
import { readFileSync } from "fs";
import path from "path";

import { REGLAS_CONTABLES } from "@/app/autos/dealer/finanzas/ayuda-contable";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");
const spec = fuente("e2e/mapaal/D4.spec.ts");
const panel = fuente("app/autos/dealer/finanzas/CostosVehiculoPanel.tsx");
const pagina = fuente("app/autos/dealer/finanzas/page.tsx");

describe("D4 guion: selectores, red y reglas contables contra el codigo de la app", () => {
  it("D4.spec.ts no hace su propio login: usa iniciarSesionQA", () => {
    expect(spec).toContain('from "./sesion-qa"');
    expect(spec).toContain("iniciarSesionQA(browser,");
    expect(spec).not.toContain("/login");
    expect(spec).not.toContain("getByPlaceholder");
  });

  it("los testids de la pagina de finanzas existen", () => {
    for (const id of ["finanzas-bloqueado", "finanzas-sin-contexto", "finanzas-vehiculo"]) {
      expect(pagina).toContain(`data-testid="${id}"`);
      expect(spec).toContain(`getByTestId("${id}")`);
    }
  });

  it("los testids del panel de costos existen", () => {
    for (const id of [
      "costos-total",
      "costos-total-valor",
      "costo-alta-form",
      "reglas-contables-costos",
      "ayuda-tipo-de-costo",
      "costo-reparacion",
      "costo-alta-ack",
      "costo-alta-error",
    ]) {
      expect(panel).toContain(`data-testid="${id}"`);
      expect(spec).toContain(`getByTestId("${id}")`);
    }
    expect(panel).toContain("data-cost-type=");
    expect(panel).toContain('"Registrar costo"');
    expect(panel).toContain('"Costo registrado."');
  });

  it("los campos de reparacion y del costo existen con el name que usa el spec", () => {
    for (const campo of ["supplier_name", "invoice_number", "document_id"]) {
      expect(panel).toContain(`name: "${campo}"`);
      expect(spec).toContain(`"${campo}"`);
    }
    for (const campo of ["cost_type", "amount", "incurred_at"]) {
      expect(panel).toContain(`name="${campo}"`);
    }
  });

  it("son cinco reglas y los textos que afirma el spec salen de ellas", () => {
    expect(REGLAS_CONTABLES).toHaveLength(5);
    const todas = REGLAS_CONTABLES.join("\n");
    for (const texto of [
      "SIN IVA recuperable",
      "El IVA recuperable no forma parte del costo del vehículo.",
      "exclusivamente comisión de compra",
    ]) {
      expect(todas).toContain(texto);
      expect(spec).toContain(texto);
    }
    expect(fuente("app/autos/dealer/finanzas/ayuda-contable.ts")).toContain("RT 54 FACPCE");
    expect(spec).toContain("RT 54 FACPCE");
  });

  it("los patrones de ruta casan con /costs y /repair-invoices del contrato", () => {
    const costo = spec.match(/const COSTO = \/(.+)\/;/);
    const reparacion = spec.match(/const REPARACION = \/(.+)\/;/);
    expect(costo).not.toBeNull();
    expect(reparacion).not.toBeNull();
    const pCosto = new RegExp(costo![1]);
    const pRep = new RegExp(reparacion![1]);
    expect(pCosto.test("/api/v1/autos/vehicles/v1/costs")).toBe(true);
    expect(pCosto.test("/api/v1/autos/vehicles/v1/costs/total")).toBe(false);
    expect(pRep.test("/api/v1/autos/vehicles/v1/repair-invoices")).toBe(true);
    const api = fuente("lib/dealer-management/vehicle-costs.ts");
    expect(api).toContain("/costs");
    expect(api).toContain("/repair-invoices");
  });
});
