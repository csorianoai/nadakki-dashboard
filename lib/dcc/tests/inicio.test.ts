import { apiFetch } from "@/lib/api/fetch-client";
import { fetchLeadsTotal, fetchSolicitudesTotal, fetchUnidadesEnStock, TARJETAS_INICIO } from "@/lib/dcc/inicio";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/dealer-management/inventory", () => ({ fetchDealerInventory: jest.fn() }));

const responde = (status: number, body: unknown) =>
  (apiFetch as jest.Mock).mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });

describe("datos del Command Center v2", () => {
  beforeEach(() => jest.resetAllMocks());

  it("leads: total del backend, ruta del dealer y sello verificado (N6)", async () => {
    responde(200, { leads: [], total: 42 });
    const cifra = await fetchLeadsTotal("t-1", "d-1");
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/autos/tenants/t-1/dealers/d-1/leads?page=1&page_size=1", expect.anything());
    expect(cifra.valor).toBe(42);
    expect(cifra.calidad).toEqual({ estado: "verificado" });
  });

  it("si el backend manda quality, manda el backend", async () => {
    responde(200, { total: 7, quality: { status: "PARTIAL", covered: 3, total: 5 } });
    const cifra = await fetchSolicitudesTotal();
    expect(cifra.calidad).toEqual({ estado: "parcial", cubiertos: 3, total: 5, motivo: null });
  });

  it("sin total en la respuesta no se inventa un 0", async () => {
    responde(200, { applications: [] });
    await expect(fetchSolicitudesTotal()).rejects.toThrow("DCC_RESPUESTA_SIN_TOTAL");
  });

  it("un 403 llega como error con status para pintar 'bloqueado'", async () => {
    responde(403, { detail: "insufficient_role" });
    await expect(fetchSolicitudesTotal()).rejects.toMatchObject({ status: 403 });
  });

  it("stock = disponible + reservado (D-N6-1) y sello parcial", async () => {
    (fetchDealerInventory as jest.Mock).mockResolvedValueOnce(
      ["disponible", "reservado", "vendido", "draft", "DISPONIBLE", null].map((status, i) => ({ id: `${i}`, status })),
    );
    const cifra = await fetchUnidadesEnStock("d-1");
    expect(cifra.valor).toBe(3);
    expect(cifra.calidad.estado).toBe("parcial");
  });

  it("toda tarjeta sin capability declara por que falta", () => {
    for (const t of TARJETAS_INICIO) {
      if (t.capability === null) expect(t.falta).toMatch(/^Falta (endpoint|métrica)/);
    }
  });
});
