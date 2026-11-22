import { ErrorInsights, pedirResumen, reintentar, urlResumen } from "../usarResumen";
import { resumen } from "./fixtures-real";

const resp = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe("usarResumen", () => {
  it("la URL lleva rango, comparacion y customer_id solo si hay cuenta", () => {
    expect(urlResumen({ from: "2026-10-12", to: "2026-11-10" })).toBe("/api/v1/marketing/insights/summary?from=2026-10-12&to=2026-11-10&compare=previous_period");
    expect(urlResumen({ from: "a", to: "b", customerId: "123" })).toContain("customer_id=123");
  });
  it("no envia X-Tenant-ID (el tenant sale del token)", async () => {
    const f = jest.fn().mockResolvedValue(resp(200, resumen()));
    await pedirResumen({ from: "a", to: "b" }, f);
    expect(JSON.stringify(f.mock.calls[0][1])).not.toMatch(/tenant/i);
  });
  it("un 403 se traduce a ErrorInsights con el codigo del backend", async () => {
    const f = jest.fn().mockResolvedValue(resp(403, { detail: "insufficient_role" }));
    await expect(pedirResumen({ from: "a", to: "b" }, f)).rejects.toMatchObject({ status: 403, codigo: "insufficient_role" });
  });
  it("cuerpo no JSON => codigo null", async () => {
    const f = jest.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error("x"); } });
    await expect(pedirResumen({ from: "a", to: "b" }, f)).rejects.toMatchObject({ status: 502, codigo: null });
  });
  it("reintentos: 4xx nunca; 5xx y red una vez", () => {
    expect(reintentar(0, new ErrorInsights(403, null))).toBe(false);
    expect(reintentar(0, new ErrorInsights(404, "account_not_found"))).toBe(false);
    expect(reintentar(0, new ErrorInsights(502, null))).toBe(true);
    expect(reintentar(1, new ErrorInsights(502, null))).toBe(false);
    expect(reintentar(0, new Error("red"))).toBe(true);
  });
});
