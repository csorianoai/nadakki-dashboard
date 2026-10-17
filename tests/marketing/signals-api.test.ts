import { leerSenales, rutaConsulta, type MarketSignal } from "@/lib/marketing/signals/api";
import { aRadarSignal, camposVisibles } from "@/lib/marketing/signals/view";

const resp = (status: number, body?: unknown) => ({ status, json: async () => body }) as unknown as Response;
const lote = { data: [], meta: { cost_cents: 0, cached: false, provider_status: "configured" } };

const base: MarketSignal = {
  signal_id: "00000000-0000-4000-8000-000000000001", signal_type: "keyword_stats", subject: "casas miami",
  geo: { country: "US" }, values: { kind: "keyword_stats", cpc_cents: 85, nota: { x: 1 } }, unit: null,
  observed_at: "2026-10-01T00:00:00Z", window: { start: "2026-09-01", end: "2026-09-30" },
  data_status: "ESTIMATED", evidence_tier: "estimado", coverage: 0.5,
  provenance: { source: "spyfu", as_of: "2026-10-01", status: "ESTIMATED", confidence: "low", method: "modelo" },
};

describe("cliente de señales (C-PI)", () => {
  it("usa rutas same-origin sin tenant", () => {
    const r = rutaConsulta({ tipo: "keyword", keyword: "a b", country: "US" });
    expect(r).toBe("/api/v1/market-signals/keyword-stats?keyword=a+b&country=US");
    expect(r).not.toMatch(/tenant/i);
    expect(rutaConsulta({ tipo: "dominio", domain: "x.com" })).toBe("/api/v1/market-signals/domains/x.com");
  });
  it.each([[401, "session_expired"], [404, "hidden"], [503, "service_unavailable"], [500, "error"]])("status %i → %s", async (s, estado) => {
    expect((await leerSenales({ tipo: "dominio", domain: "x.com" }, async () => resp(s))).estado).toBe(estado);
  });
  it("200 vacío es ok; cuerpo inválido es error; no envía cabecera de tenant", async () => {
    const enviar = jest.fn(async () => resp(200, lote));
    expect((await leerSenales({ tipo: "interes", keyword: "k", country: "US" }, enviar)).estado).toBe("ok");
    expect(JSON.stringify(enviar.mock.calls[0][1])).not.toMatch(/tenant/i);
    expect((await leerSenales({ tipo: "dominio", domain: "x.com" }, async () => resp(200, {}))).estado).toBe("error");
  });
  it.each(["DEMO", "RARO"])("200 con data_status %s es contract_violation, nunca ok", async (ds) => {
    const cuerpo = { ...lote, data: [{ ...base, data_status: ds }] };
    expect((await leerSenales({ tipo: "dominio", domain: "x.com" }, async () => resp(200, cuerpo))).estado).toBe("contract_violation");
  });
  it("200 con provenance.status distinto de data_status es contract_violation", async () => {
    const cuerpo = { ...lote, data: [{ ...base, provenance: { ...base.provenance, status: "LIVE" as const } }] };
    expect((await leerSenales({ tipo: "dominio", domain: "x.com" }, async () => resp(200, cuerpo))).estado).toBe("contract_violation");
  });
  it("200 con señales válidas es ok", async () => {
    expect((await leerSenales({ tipo: "dominio", domain: "x.com" }, async () => resp(200, { ...lote, data: [base] }))).estado).toBe("ok");
  });
  it("sin Bearer no envía la petición", async () => {
    window.localStorage.clear();
    expect((await leerSenales({ tipo: "dominio", domain: "x.com" })).estado).toBe("session_expired");
  });
});

describe("vista", () => {
  it("UNAVAILABLE sin cifras y con motivo", () => {
    const s = { ...base, data_status: "UNAVAILABLE" as const, unavailable_reason: "budget_exhausted" as const };
    expect(camposVisibles(s)).toEqual([]);
    const r = aRadarSignal(s);
    expect(r.status).toBe("UNAVAILABLE");
    expect(r.note).toMatch(/presupuesto/);
    expect(r.points).toEqual([]);
  });
  it("ESTIMATED muestra solo escalares", () => {
    expect(camposVisibles(base)).toEqual([["cpc_cents", "85"]]);
    expect(aRadarSignal(base).precision).toBe("Cobertura 50 %");
  });
});
