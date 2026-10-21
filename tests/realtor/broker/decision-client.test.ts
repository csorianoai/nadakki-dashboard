import { BASE_BROKER, decidir, type Enviar } from "@/lib/realtor/broker/client";
import { DEMO_ITEMS } from "@/lib/realtor/broker/demo";

const responder = (status: number, cuerpo: unknown = {}): jest.MockedFunction<Enviar> =>
  jest.fn(async () => ({ status, json: async () => cuerpo }) as unknown as Response);

describe("decidir (POST /broker-desk/items/{id}/decision)", () => {
  it("envia solo decision y reason, sin tenant, con POST JSON", async () => {
    const enviar = responder(200, { ...DEMO_ITEMS[0], status: "approved" });
    const r = await decidir("a/b", "approved", " todo en orden ", enviar);
    expect(r).toEqual({ estado: "ok", datos: { ...DEMO_ITEMS[0], status: "approved" } });
    const [ruta, init] = enviar.mock.calls[0];
    expect(ruta).toBe(`${BASE_BROKER}/items/a%2Fb/decision`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ decision: "approved", reason: "todo en orden" });
    expect(String(init?.body)).not.toMatch(/tenant/i);
  });

  it.each([[403, "prohibido"], [404, "no-existe"], [409, "conflicto"], [422, "invalido"], [500, "error"]] as const)(
    "%s se traduce a %s", async (status, motivo) => {
      expect(await decidir("x", "rejected", "motivo", responder(status))).toEqual({ estado: "error", motivo });
    });

  it("un fallo de red es error", async () => {
    expect(await decidir("x", "rejected", "m", jest.fn(async () => { throw new Error("red"); }))).toEqual({ estado: "error", motivo: "error" });
  });

  it("sin motivo no llama al backend", async () => {
    const enviar = responder(200);
    expect(await decidir("x", "approved", "   ", enviar)).toEqual({ estado: "error", motivo: "invalido" });
    expect(enviar).not.toHaveBeenCalled();
  });
});
