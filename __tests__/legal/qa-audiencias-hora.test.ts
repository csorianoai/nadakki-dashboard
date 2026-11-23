import { horaDelTribunalAIso, humanizeToken } from "@/lib/legal/hearings/hearings-format";

describe("audiencias (QA 23-nov)", () => {
  it("9:30 en Santo Domingo es 13:30 UTC, sin importar la zona del navegador", () => {
    expect(horaDelTribunalAIso("2026-12-01T09:30", "America/Santo_Domingo")).toBe("2026-12-01T13:30:00.000Z");
  });
  it("respeta zonas con horario de verano (Nueva York en julio = UTC-4)", () => {
    expect(horaDelTribunalAIso("2026-07-01T09:30", "America/New_York")).toBe("2026-07-01T13:30:00.000Z");
    expect(horaDelTribunalAIso("2026-12-01T09:30", "America/New_York")).toBe("2026-12-01T14:30:00.000Z");
  });
  it("estados y tipos en español con tildes", () => {
    expect(humanizeToken("NO_SHOW")).toBe("No comparecencia");
    expect(humanizeToken("AUDIENCIA_CONCILIACION")).toBe("Audiencia de conciliación");
    expect(humanizeToken("ALGO_NUEVO")).toBe("Algo Nuevo");
  });
});
