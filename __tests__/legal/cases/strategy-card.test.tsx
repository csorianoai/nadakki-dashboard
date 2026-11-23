import { fortalezaDeEstrategia } from "@/components/legal/cases/CaseStrategyCard";
import type { CaseStrategy } from "@/lib/legal/cases/case-types";

const etiquetas = { alta: "alta", media: "media", baja: "baja" };
const base = { strategy_id: "s1", name: "", description: "", legal_basis: "", rationale: "", risks: [], selected: false, status: "proposed" } as CaseStrategy;

describe("fortalezaDeEstrategia", () => {
  it("usa la confianza del modelo cuando no hay porcentaje (antes salía NaN%)", () => {
    expect(fortalezaDeEstrategia({ ...base, confianza: "media" }, etiquetas)).toBe("media");
  });
  it("respeta el porcentaje si existe", () => {
    expect(fortalezaDeEstrategia({ ...base, expected_strength: 0.7 }, etiquetas)).toBe("70%");
  });
  it("sin ninguno de los dos no muestra nada", () => {
    expect(fortalezaDeEstrategia(base, etiquetas)).toBeNull();
  });
});
