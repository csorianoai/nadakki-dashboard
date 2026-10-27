import { BASE_BROKER } from "@/lib/realtor/broker/client";
import { qaDecidir, qaHistorial, type QaEnviar } from "@/components/realtor/broker/qa-client";

const responder = (status: number, cuerpo: unknown = {}): jest.MockedFunction<QaEnviar> =>
  jest.fn(async () => ({ status, json: async () => cuerpo }) as unknown as Response);

describe("qaDecidir (POST /broker-desk/items/{id}/qa-decision)", () => {
  it.each([[403, "prohibido"], [404, "no-existe"], [409, "conflicto"], [422, "invalido"], [500, "error"]] as const)(
    "%s se traduce a %s", async (status, motivo) => {
      expect(await qaDecidir("x", "rejected", "motivo", responder(status))).toEqual({ estado: "error", motivo });
    });

  it("sin motivo no llama al backend", async () => {
    const enviar = responder(200);
    expect(await qaDecidir("x", "approved", "  ", enviar)).toEqual({ estado: "error", motivo: "invalido" });
    expect(enviar).not.toHaveBeenCalled();
  });

  it("un fallo de red es error", async () => {
    expect(await qaDecidir("x", "returned", "m", jest.fn(async () => { throw new Error("red"); }))).toEqual({ estado: "error", motivo: "error" });
  });

  it("envia solo decision y reason, sin tenant, por POST JSON", async () => {
    const enviar = responder(200, { id: "a/b", status: "approved" });
    const r = await qaDecidir("a/b", "approved", " ok ", enviar);
    expect(r.estado).toBe("ok");
    const [ruta, init] = enviar.mock.calls[0];
    expect(ruta).toBe(`${BASE_BROKER}/items/a%2Fb/qa-decision`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ decision: "approved", reason: "ok" });
    expect(String(init?.body)).not.toMatch(/tenant/i);
  });
});

describe("qaHistorial (GET .../qa-history)", () => {
  it("lee las entradas", async () => {
    const e = { decision: "returned", reason: "falta", decided_at: "2026-10-27T00:00:00Z" };
    expect(await qaHistorial("p1", responder(200, { entries: [e] }))).toEqual({ estado: "ok", datos: [e] });
  });
  it("404 es vacio y otro fallo es error", async () => {
    expect(await qaHistorial("p1", responder(404))).toEqual({ estado: "vacio" });
    expect(await qaHistorial("p1", responder(500))).toEqual({ estado: "error" });
  });
});
