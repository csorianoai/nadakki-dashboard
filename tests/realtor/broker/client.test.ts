import { BASE_BROKER, leerItem, leerItems, leerMesa, leerResumen, rutaItems, type Enviar } from "@/lib/realtor/broker/client";
import { DEMO_DESK, DEMO_ITEMS, DEMO_SUMMARY } from "@/lib/realtor/broker/demo";

const responder = (status: number, cuerpo: unknown = {}): Enviar =>
  jest.fn(async () => ({ status, json: async () => cuerpo }) as unknown as Response);

describe("cliente de la bandeja del broker", () => {
  it("rutaItems arma filtros y limite por defecto sin tenant", () => {
    expect(rutaItems({})).toBe(`${BASE_BROKER}/items?limit=50`);
    const ruta = rutaItems({ status: "pending", kind: "brand_publication", cursor: "c1", limit: 10 });
    expect(ruta).toContain("status=pending");
    expect(ruta).toContain("kind=brand_publication");
    expect(ruta).toContain("cursor=c1");
    expect(ruta).toContain("limit=10");
    expect(ruta).not.toMatch(/tenant/i);
  });

  it("200 devuelve los datos y usa solo GET sin cache", async () => {
    const enviar = responder(200, DEMO_DESK);
    expect(await leerMesa(enviar)).toEqual({ estado: "ok", datos: DEMO_DESK });
    expect(enviar).toHaveBeenCalledWith(BASE_BROKER, { method: "GET", cache: "no-store" });
    expect(await leerResumen(responder(200, DEMO_SUMMARY))).toEqual({ estado: "ok", datos: DEMO_SUMMARY });
    const pagina = { items: DEMO_ITEMS, next_cursor: null };
    expect(await leerItems({}, responder(200, pagina))).toEqual({ estado: "ok", datos: pagina });
  });

  it("404 y 503 son vacio; otros codigos y fallos de red son error", async () => {
    expect(await leerMesa(responder(404))).toEqual({ estado: "vacio" });
    expect(await leerResumen(responder(503))).toEqual({ estado: "vacio" });
    expect(await leerItems({}, responder(401))).toEqual({ estado: "error" });
    expect(await leerMesa(responder(500))).toEqual({ estado: "error" });
    expect(await leerMesa(jest.fn(async () => { throw new Error("red"); }))).toEqual({ estado: "error" });
  });

  it("leerItem codifica el id", async () => {
    const enviar = responder(200, DEMO_ITEMS[0]);
    await leerItem("a/b", enviar);
    expect(enviar).toHaveBeenCalledWith(`${BASE_BROKER}/items/a%2Fb`, { method: "GET", cache: "no-store" });
  });
});
