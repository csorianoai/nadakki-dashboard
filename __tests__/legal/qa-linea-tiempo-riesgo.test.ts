import { detalleEvento, nombreEvento } from "@/lib/legal/cases/eventos";

describe("línea de tiempo legible (QA 23-nov)", () => {
  it("traduce los códigos y muestra estados y motivo", () => {
    expect(nombreEvento("state.changed")).toBe("Cambio de estado");
    expect(nombreEvento("document.reviewed_by_attorney")).toBe("Documento revisado por abogado");
    expect(nombreEvento("action.compute_deadlines")).toBe("Plazos calculados");
    const d = detalleEvento(
      { event_id: "1", event_type: "state.changed", event_category: "lifecycle", occurred_at: "", payload: { from_state: "HEARING", to_state: "JUDGMENT", reason: "Se dictó sentencia" } },
      (s) => ({ HEARING: "Audiencia", JUDGMENT: "Sentencia" })[s] ?? s,
    );
    expect(d).toBe("Audiencia → Sentencia · Motivo: Se dictó sentencia");
  });
  it("un código desconocido se muestra tal cual y sin detalle no inventa", () => {
    expect(nombreEvento("algo.nuevo")).toBe("algo.nuevo");
    expect(detalleEvento({ event_id: "1", event_type: "case.created", event_category: "x", occurred_at: "", payload: {} }, (s) => s)).toBeNull();
  });
});
