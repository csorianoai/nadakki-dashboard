import { hasData, parseMiDia } from "@/lib/realtor/mi-dia/api";

const ok = (items: unknown[], count = items.length) => ({ quality: "OK", count, items });
const body = (over: Record<string, unknown> = {}) => ({
  generated_at: "2000-01-01T00:00:00Z", scope: "agent",
  leads_sin_primera_respuesta: ok([{ lead_id: "SYNTH-1", channel: "web", intent: "rent", status: "new", received_at: "2000-01-01T00:00:00Z", waiting_hours: 3.5 }]),
  listings_con_requisitos_bloqueantes: { quality: "NO_DISPONIBLE", reason: "SYNTH", count: null, items: [] },
  broker_desk_pendientes: ok([]),
  ...over,
});

describe("parseMiDia", () => {
  it("lee el cuerpo del contrato", () => {
    const d = parseMiDia(body());
    expect(d?.leads.items).toHaveLength(1);
    expect(d?.listings).toEqual({ quality: "NO_DISPONIBLE", count: null, items: [] });
    expect(d && hasData(d)).toBe(true);
  });
  it("sin registros no hay datos", () => {
    const d = parseMiDia(body({ leads_sin_primera_respuesta: ok([]) }));
    expect(d && hasData(d)).toBe(false);
  });
  it.each([[{}], [null], [body({ scope: "x" })], [body({ broker_desk_pendientes: { quality: "OK", items: [] } })]])("forma inválida → null", (b) => {
    expect(parseMiDia(b)).toBeNull();
  });
});
