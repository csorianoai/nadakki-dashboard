import { hasData, parseMiDia } from "@/lib/realtor/mi-dia/api";
import { miDiaEn, miDiaEs } from "@/lib/realtor/mi-dia/copy";

const okSec = (items: unknown[]) => ({ quality: "OK", count: items.length, items });
const visit = (over: Record<string, unknown> = {}) => ({ event_id: "SYNTH-E1", title: "Visita SYNTH", starts_at: "2000-01-01T15:30:00Z", property_id: "SYNTH-P1", ...over });
const body = (visitas: unknown) => ({
  generated_at: "2000-01-01T00:00:00Z", scope: "agent",
  leads_sin_primera_respuesta: okSec([]),
  listings_con_requisitos_bloqueantes: okSec([]),
  broker_desk_pendientes: okSec([]),
  visitas_del_dia: visitas,
});

describe("parseMiDia · visitas del día", () => {
  it("sin la sección en el cuerpo → NO_DISPONIBLE, nunca visitas inventadas", () => {
    const b = body(undefined) as Record<string, unknown>;
    delete b.visitas_del_dia;
    expect(parseMiDia(b)?.visitas).toEqual({ quality: "NO_DISPONIBLE", count: null, items: [] });
  });
  it("sección malformada → null (fail-closed)", () => {
    expect(parseMiDia(body({ quality: "OK", items: [] }))).toBeNull();
    expect(parseMiDia(body("x"))).toBeNull();
  });
  it("descarta filas incompletas", () => {
    const d = parseMiDia(body(okSec([visit(), { event_id: "SYNTH-E2" }])));
    expect(d?.visitas.items).toHaveLength(1);
  });
  it("property_id null (evento sin propiedad) se conserva", () => {
    const d = parseMiDia(body(okSec([visit({ property_id: null })])));
    expect(d?.visitas.items).toHaveLength(1);
  });
  it("fila con la forma antigua (visit_id/listing_id/scheduled_at/status) se descarta", () => {
    const old = { visit_id: "SYNTH-V1", listing_id: "SYNTH-P1", scheduled_at: "2000-01-01T15:30:00Z", status: "scheduled" };
    const d = parseMiDia(body(okSec([old])));
    expect(d?.visitas.items).toEqual([]);
  });
  it("solo visitas ya cuenta como datos", () => {
    const d = parseMiDia(body(okSec([visit()])));
    expect(d && hasData(d)).toBe(true);
  });
});

it("ES y EN: títulos de visitas distintos", () => {
  expect(miDiaEn.visits).not.toBe(miDiaEs.visits);
});
