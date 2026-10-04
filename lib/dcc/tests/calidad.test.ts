import {
  calidadDesdeBackend,
  calidadDesdeEntitlement,
  permiteCifra,
  rotuloCalidad,
} from "@/lib/dcc/calidad";

describe("calidad (sello DCC)", () => {
  it("lee los estados firmados de N6", () => {
    expect(calidadDesdeBackend("VERIFICADA")).toEqual({ estado: "verificado" });
    expect(calidadDesdeBackend("NO_DISPONIBLE").estado).toBe("no_disponible");
    expect(calidadDesdeBackend({ estado: "PARCIAL", cubiertos: 3, total: 5 })).toEqual({
      estado: "parcial",
      cubiertos: 3,
      total: 5,
      motivo: null,
    });
  });

  it("forma desconocida nunca sube a verificado; cobertura incoherente no pinta n/m", () => {
    expect(calidadDesdeBackend(undefined).estado).toBe("no_disponible");
    expect(calidadDesdeBackend("OK").estado).toBe("no_disponible");
    expect(rotuloCalidad(calidadDesdeBackend({ status: "PARTIAL", covered: 9, total: 5 }))).toBe("Parcial");
  });

  it("rotulos legibles, sin claves tecnicas", () => {
    expect(rotuloCalidad({ estado: "parcial", cubiertos: 3, total: 5, motivo: null })).toBe("Parcial 3/5");
    expect(rotuloCalidad({ estado: "bloqueado", reasonCode: "UPGRADE_REQUIRED" })).toBe("Bloqueado por tu plan");
    expect(rotuloCalidad({ estado: "no_disponible", motivo: null })).toBe("Aún no disponible");
  });

  it("el entitlement denegado del backend bloquea; permitido no aporta sello", () => {
    expect(calidadDesdeEntitlement({ allowed: false, reason_code: "UPGRADE_REQUIRED" })).toEqual({
      estado: "bloqueado",
      reasonCode: "UPGRADE_REQUIRED",
    });
    expect(calidadDesdeEntitlement({ allowed: true, reason_code: null })).toBeNull();
    expect(calidadDesdeEntitlement(undefined)).toBeNull();
  });

  it("solo verificado y parcial dejan mostrar cifra", () => {
    expect(permiteCifra({ estado: "verificado" })).toBe(true);
    expect(permiteCifra({ estado: "bloqueado", reasonCode: null })).toBe(false);
    expect(permiteCifra({ estado: "no_disponible", motivo: null })).toBe(false);
  });
});
