/**
 * F4E-3 PARTE 1/2: cliente del asistente contable (solo lectura).
 */
import { apiFetch } from "@/lib/api/fetch-client";
import { ENLACES_PERMITIDOS, RUTA_CHAT, enlaceSeguro, enviarMensaje } from "@/lib/agents/contable/asistente-client";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

beforeEach(() => apiFetchMock.mockReset());

describe("enlaceSeguro", () => {
  it("acepta solo las rutas de la lista blanca identica a la del backend", () => {
    expect(Object.keys(ENLACES_PERMITIDOS).sort()).toEqual([
      "/autos/dealer/contactos",
      "/autos/dealer/finanzas",
      "/autos/dealer/inventario",
      "/autos/dealer/inventario/importar",
      "/autos/dealer/inventario/nuevo",
      "/autos/dealer/leads",
    ]);
    expect(enlaceSeguro("/autos/dealer/finanzas")).toBe("/autos/dealer/finanzas");
    expect(enlaceSeguro("/autos/dealer/finanzas?vehiculo=ID")).toBe("/autos/dealer/finanzas?vehiculo=ID");
  });

  it("rechaza externos, javascript:, rutas desconocidas y protocolo-relativo", () => {
    for (const t of ["https://ejemplo.com", "javascript:alert(1)", "/autos/dealer/otra", "//ejemplo.com", "/autos/dealer/finanzas/../x", "/autos/dealer/finanzas?x=<b>", "/constructor", ""]) {
      expect(enlaceSeguro(t)).toBeNull();
    }
  });
});

describe("enviarMensaje", () => {
  it("hace POST solo a /api/assistant/contable/chat con {message}", async () => {
    apiFetchMock.mockResolvedValue(ok({ response: "ok", links: ["/autos/dealer/leads", 5] }));
    const r = await enviarMensaje("hola");
    expect(r).toEqual({ ok: true, data: { response: "ok", links: ["/autos/dealer/leads"] } });
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = apiFetchMock.mock.calls[0];
    expect(url).toBe(RUTA_CHAT);
    expect(RUTA_CHAT).toBe("/api/assistant/contable/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ message: "hola" });
  });

  it("falla cerrado con 404, error de red o cuerpo invalido", async () => {
    apiFetchMock.mockResolvedValueOnce(ok({}, 404));
    expect(await enviarMensaje("a")).toEqual({ ok: false });
    apiFetchMock.mockRejectedValueOnce(new Error("red"));
    expect(await enviarMensaje("a")).toEqual({ ok: false });
    apiFetchMock.mockResolvedValueOnce(ok({ foo: 1 }));
    expect(await enviarMensaje("a")).toEqual({ ok: false });
  });
});
