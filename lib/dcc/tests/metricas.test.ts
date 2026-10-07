import { apiFetch } from "@/lib/api/fetch-client";
import {
  fetchFinanciamientoDelMes,
  fetchMargenDelMes,
  fetchMetricasLeadsDelMes,
  fetchMetricasInventario,
  metricaDesdeBackend,
  presentarDias,
  presentarImporte,
  presentarNumero,
  presentarPorcentaje,
} from "@/lib/dcc/metricas";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

const responde = (status: number, body: unknown) =>
  (apiFetch as jest.Mock).mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });

const q = (status: string, covered: number, total: number) => ({ status, covered, total });

/** Forma real de services/autos_portal/dealer_metrics_router.py (nadakki-ai-suite main). */
const INVENTARIO = {
  dealer_id: "d-1",
  as_of: "2026-10-07T12:00:00+00:00",
  currency: "ARS",
  stock_statuses: ["disponible", "reservado"],
  metrics: {
    inventory_units: { metric_key: "inventory_units@1.0", value: 14, unit: "units", quality: q("VERIFICADA", 14, 14), reasons: [] },
    inventory_capital: { metric_key: "inventory_capital@1.0", value: "182400000.00", unit: "ARS", quality: q("PARCIAL", 12, 14), reasons: ["UNIDADES_SIN_COMPRA"] },
    inventory_age_days: { metric_key: "inventory_age_days@1.0", value: { avg: 37.4, max: 121 }, unit: "days", quality: q("VERIFICADA", 14, 14), reasons: [] },
    potential_revenue: { metric_key: "potential_revenue@1.0", value: null, unit: null, quality: q("NO_DISPONIBLE", 0, 14), reasons: ["MONEDA_FUNCIONAL_NO_CONFIGURADA"] },
  },
};

describe("metricas F3 del dealer", () => {
  beforeEach(() => jest.resetAllMocks());

  it("inventario: ruta del dealer y sellos tal como los manda el backend", async () => {
    responde(200, INVENTARIO);
    const r = await fetchMetricasInventario("d 1");
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/autos/dealers/d%201/metrics/inventory", expect.anything());
    expect(r.metricas.inventory_units.calidad).toEqual({ estado: "verificado" });
    expect(r.metricas.inventory_capital.calidad).toEqual({
      estado: "parcial",
      cubiertos: 12,
      total: 14,
      motivo: "Hay unidades en stock sin costo de compra cargado",
    });
    expect(r.metricas.potential_revenue.calidad).toEqual({
      estado: "no_disponible",
      motivo: "Falta configurar la moneda de la empresa",
      delBackend: true,
    });
  });

  it("margen: periodo del backend; sin ventas el motivo lo dice en llano", async () => {
    responde(200, {
      period: "2026-10",
      metrics: { gross_margin: { metric_key: "gross_margin@1.0", value: null, unit: "ARS", quality: q("NO_DISPONIBLE", 0, 0), reasons: [] } },
    });
    const r = await fetchMargenDelMes("d-1");
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/autos/dealers/d-1/metrics/margin", expect.anything());
    expect(r.periodo).toBe("2026-10");
    expect(r.metricas.gross_margin.calidad).toEqual({ estado: "no_disponible", motivo: "Sin ventas registradas este mes", delBackend: true });
  });

  it("leads y financiamiento: rutas del dealer y sello PARCIAL de la ficha con su motivo en llano", async () => {
    responde(200, {
      period: "2026-10",
      metrics: { lead_response_time: { value: 3.5, unit: "hours", quality: q("PARCIAL", 8, 10), reasons: ["NEW_A_QUALIFIED_SIN_CONTACTO"] } },
    });
    const l = await fetchMetricasLeadsDelMes("d-1");
    expect(apiFetch).toHaveBeenLastCalledWith("/api/v1/autos/dealers/d-1/metrics/leads", expect.anything());
    expect(presentarNumero(l, "lead_response_time", "es-AR").valor).toBe("3,5");
    responde(200, {
      period: "2026-10",
      metrics: {
        financing_offers_ready: { value: 4, unit: "applications", quality: q("PARCIAL", 4, 4), reasons: ["FICHA_PARCIAL_POR_DEALER"] },
        finance_conversion_rate: { value: null, unit: "percent", quality: q("NO_DISPONIBLE", 0, 0), reasons: ["SIN_SOLICITUDES_EN_EL_PERIODO"] },
      },
    });
    const f = await fetchFinanciamientoDelMes("d-1");
    expect(apiFetch).toHaveBeenLastCalledWith("/api/v1/autos/dealers/d-1/metrics/financing", expect.anything());
    expect(presentarNumero(f, "financing_offers_ready", "es-AR")).toEqual({
      valor: "4",
      calidad: { estado: "parcial", cubiertos: 4, total: 4, motivo: "Parcial según la ficha firmada" },
    });
    expect(presentarPorcentaje(f, "finance_conversion_rate", "es-AR")).toEqual({
      valor: null,
      calidad: { estado: "no_disponible", motivo: "Sin solicitudes de crédito este mes", delBackend: true },
    });
  });

  it("error HTTP se propaga con su status; respuesta sin metrics falla", async () => {
    responde(403, { detail: { reason_code: "UPGRADE_REQUIRED" } });
    await expect(fetchMetricasInventario("d-1")).rejects.toMatchObject({ status: 403 });
    responde(200, { dealer_id: "d-1" });
    await expect(fetchMetricasInventario("d-1")).rejects.toThrow("DCC_RESPUESTA_SIN_METRICAS");
  });

  it("parcial con cobertura incoherente no inventa n/m; codigo desconocido pasa tal cual", () => {
    const m = metricaDesdeBackend({ value: 1, quality: q("PARCIAL", 9, 3), reasons: ["CODIGO_NUEVO"] }, "x");
    expect(m.calidad).toEqual({ estado: "parcial", cubiertos: null, total: null, motivo: "CODIGO_NUEVO" });
    expect(metricaDesdeBackend("basura", "x").calidad.estado).toBe("no_disponible");
  });
});

describe("presentacion: formatea, no calcula", () => {
  const inv = {
    periodo: null,
    metricas: Object.fromEntries(Object.entries(INVENTARIO.metrics).map(([k, v]) => [k, metricaDesdeBackend(v, "vacio")])),
  };

  it("importe compacto en la moneda de la metrica", () => {
    const p = presentarImporte(inv, "inventory_capital", "es-AR");
    expect(p.valor).toMatch(/^\$\s?182,4\s?M/);
    expect(p.calidad.estado).toBe("parcial");
  });

  it("no disponible no pinta cifra", () => {
    expect(presentarImporte(inv, "potential_revenue", "es-AR")).toEqual({ valor: null, calidad: inv.metricas.potential_revenue.calidad });
  });

  it("sello que permite cifra pero sin moneda: no disponible, sin cifra", () => {
    const m = { periodo: null, metricas: { x: metricaDesdeBackend({ value: "10.00", unit: null, quality: q("VERIFICADA", 1, 1), reasons: [] }, "v") } };
    const p = presentarImporte(m, "x", "es-AR");
    expect(p.valor).toBeNull();
    expect(p.calidad).toMatchObject({ estado: "no_disponible", delBackend: true });
  });

  it("metrica ausente en la respuesta: no disponible", () => {
    expect(presentarImporte(inv, "no_existe", "es-AR").calidad.estado).toBe("no_disponible");
    expect(presentarPorcentaje(undefined, "gross_margin_pct", "es-AR").valor).toBeNull();
  });

  it("porcentaje del backend se escribe tal cual (0-100)", () => {
    const m = { periodo: "2026-10", metricas: { gross_margin_pct: metricaDesdeBackend({ value: 14.27, unit: "percent", quality: q("PARCIAL", 3, 4), reasons: [] }, "v") } };
    expect(presentarPorcentaje(m, "gross_margin_pct", "es-AR").valor).toBe("14,27 %");
  });

  it("dias: promedio y maximo del backend", () => {
    const p = presentarDias(inv, "es-AR");
    expect(p.valor).toBe("37,4");
    expect(p.maximo).toBe("121");
    expect(p.calidad).toEqual({ estado: "verificado" });
  });
});
