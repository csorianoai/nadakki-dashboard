import { readFileSync } from "fs";
import { join } from "path";
import { etiquetaCondicionVehiculo, etiquetaRevisionManual } from "@/components/credit-hub/bank/etiquetas-es";

const leer = (ruta: string) => readFileSync(join(process.cwd(), ruta), "utf8");

describe("PS-12 textos en español de /herramientas", () => {
  it("traduce la condición del vehículo", () => {
    expect(etiquetaCondicionVehiculo("new")).toBe("Nuevo");
    expect(etiquetaCondicionVehiculo("USED")).toBe("Usado");
    expect(etiquetaCondicionVehiculo("otra")).toBe("otra");
  });

  it("traduce el estado de revisión manual", () => {
    expect(etiquetaRevisionManual("PENDING_MANUAL_REVIEW")).toBe("Pendiente de revisión manual");
  });

  it("EscalationsList y AnalysisTab no pintan las cadenas en inglés", () => {
    const esc = leer("components/credit-hub/bank/EscalationsList.tsx");
    expect(esc).not.toMatch(/<span>PENDING_MANUAL_REVIEW<\/span>/);
    expect(esc).toContain("etiquetaRevisionManual");
    expect(leer("components/credit-hub/bank/sections/AnalysisTab.tsx")).toContain("etiquetaCondicionVehiculo");
  });
});
