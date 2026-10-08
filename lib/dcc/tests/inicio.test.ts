import { apiFetch } from "@/lib/api/fetch-client";
import { briefDeterminista, CAPABILITIES_INICIO, detalleDeError, esUuid, fetchLeadsTotal, fetchSolicitudesTotal, fetchLeadsPagina, fetchUnidadesEnStock, TARJETAS_DETALLE, TARJETAS_INICIO, textoLeads } from "@/lib/dcc/inicio";
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
    expect(cifra.cargados).toBe(6);
    expect(cifra.borradores).toBe(1);
    expect(cifra.nota).toBe("de 6 cargados · 1 en borrador");
  });

  it("toda tarjeta sin capability declara por que falta", () => {
    for (const t of TARJETAS_INICIO) {
      if (t.capability === null) expect(t.falta).toMatch(/^Falta (endpoint|métrica)/);
    }
  });

  it("la fila de Estado del negocio son los 6 KPI de la referencia, en orden", () => {
    expect(TARJETAS_INICIO.map((t) => t.titulo)).toEqual(["Inventario", "Capital", "Margen", "Leads", "Financiamiento", "Caja"]);
  });

  it("F3: toda la fila de detalle tiene ruta en main y la capability que exige el backend; el batch no repite capabilities", () => {
    expect(TARJETAS_DETALLE.filter((t) => t.capability === null)).toEqual([]);
    expect(Object.fromEntries(TARJETAS_DETALLE.map((t) => [t.id, t.capability]))).toEqual({
      dias: "autos.inventory.list",
      ingreso: "autos.inventory.list",
      respuesta: "autos.leads.crm",
      conversion: "autos.leads.crm",
      ofertas: "credit.applications.view",
      fondeo: "credit.applications.view",
    });
    expect(TARJETAS_INICIO.find((t) => t.id === "capital")?.capability).toBe("autos.inventory.list");
    expect(new Set(CAPABILITIES_INICIO).size).toBe(CAPABILITIES_INICIO.length);
  });

  it("esUuid distingue el UUID del tenant de su slug", () => {
    expect(esUuid("11111111-1111-1111-1111-111111111111")).toBe(true);
    expect(esUuid("mapaal")).toBe(false);
    expect(esUuid(null)).toBe(false);
  });

  it("detalleDeError da codigo HTTP y motivo para el tooltip", () => {
    expect(detalleDeError({ status: 500, reason_code: null, message: "HTTP 500" })).toBe("HTTP 500");
    expect(detalleDeError({ status: 422, reason_code: "X" })).toBe("HTTP 422 · X");
    expect(detalleDeError(null)).toBe("Error desconocido");
  });

  it("brief determinista: solo con las cifras que llegaron", () => {
    const f = (n: number) => String(n);
    const c = (valor: number, extra = {}) => ({ valor, calidad: { estado: "verificado" as const }, nota: "", ...extra });
    expect(briefDeterminista({}, f)).toBeNull();
    expect(briefDeterminista({ leads: c(14) }, f)).toBe("Hoy tienes 14 leads en total.");
    expect(briefDeterminista({ stock: c(0, { cargados: 5, borradores: 5 }), leads: c(1), solicitudes: c(2) }, f)).toBe(
      "Hoy tienes 0 unidades en stock (5 en borrador de 5 cargadas), 1 lead en total y 2 solicitudes de crédito.",
    );
  });

  it("textoLeads pluraliza: 1 lead / N leads", () => {
    expect(textoLeads(1)).toBe("1 lead");
    expect(textoLeads(0)).toBe("0 leads");
    expect(textoLeads(1234, (n) => n.toLocaleString("es-AR"))).toBe("1.234 leads");
  });

  it("fetchLeadsPagina pide la pagina con tenant UUID y dealer, y rechaza respuestas sin lista", async () => {
    const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
    (apiFetch as jest.Mock).mockResolvedValueOnce(ok({ leads: [{ id: "x" }], total: 21, page: 2, page_size: 20, has_next: false }));
    const r = await fetchLeadsPagina("t-uuid", "d 1", 2, 20);
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/autos/tenants/t-uuid/dealers/d%201/leads?page=2&page_size=20", expect.anything());
    expect(r).toEqual({ leads: [{ id: "x" }], total: 21, page: 2, hasNext: false });
    (apiFetch as jest.Mock).mockResolvedValueOnce(ok({ total: 3 }));
    await expect(fetchLeadsPagina("t", "d")).rejects.toThrow("DCC_RESPUESTA_SIN_LEADS");
  });
});
