import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { CommandCenterV2 } from "../CommandCenterV2";
import { AuthContext } from "@/lib/auth/auth-context";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchLeadsTotal, fetchSolicitudesTotal, fetchUnidadesEnStock } from "@/lib/dcc/inicio";
import { fetchFinanciamientoDelMes, fetchMargenDelMes, fetchMetricasInventario, fetchMetricasLeadsDelMes, metricaDesdeBackend } from "@/lib/dcc/metricas";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: jest.fn() }));
jest.mock("@/lib/dealer/access-context", () => ({ selectedDealerIdentity: jest.fn() }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS" } }),
}));
jest.mock("@/lib/dcc/inicio", () => ({
  ...jest.requireActual("@/lib/dcc/inicio"),
  fetchUnidadesEnStock: jest.fn(),
  fetchLeadsTotal: jest.fn(),
  fetchSolicitudesTotal: jest.fn(),
}));
jest.mock("@/lib/dcc/metricas", () => ({
  ...jest.requireActual("@/lib/dcc/metricas"),
  fetchMetricasInventario: jest.fn(),
  fetchMargenDelMes: jest.fn(),
  fetchMetricasLeadsDelMes: jest.fn(),
  fetchFinanciamientoDelMes: jest.fn(),
}));

const q = (status: string, covered: number, total: number) => ({ status, covered, total });
/** Forma de dealer_metrics.py (F3-METRICAS), pasada por el parser real. */
const metricas = (periodo: string | null, crudas: Record<string, unknown>) => ({
  periodo,
  metricas: Object.fromEntries(Object.entries(crudas).map(([k, v]) => [k, metricaDesdeBackend(v, "Sin ventas registradas este mes")])),
});
const INVENTARIO = metricas(null, {
  inventory_capital: { value: "182400000.00", unit: "ARS", quality: q("PARCIAL", 12, 14), reasons: ["UNIDADES_SIN_COMPRA"] },
  inventory_age_days: { value: { avg: 37.4, max: 121 }, unit: "days", quality: q("VERIFICADA", 14, 14), reasons: [] },
  potential_revenue: { value: "241900000.00", unit: "ARS", quality: q("VERIFICADA", 14, 14), reasons: [] },
});
const MARGEN = metricas("2026-10", {
  gross_margin: { value: "23150000.00", unit: "ARS", quality: q("PARCIAL", 3, 4), reasons: ["VENDIDOS_SIN_REGISTRO_DE_VENTA"] },
  gross_margin_pct: { value: 14.27, unit: "percent", quality: q("PARCIAL", 3, 4), reasons: [] },
});
const LEADS_MES = metricas("2026-10", {
  lead_response_time: { value: 3.5, unit: "hours", quality: q("PARCIAL", 8, 10), reasons: ["NEW_A_QUALIFIED_SIN_CONTACTO"] },
  lead_conversion_rate: { value: 12.5, unit: "percent", quality: q("PARCIAL", 16, 16), reasons: ["WON_SIN_ENLACE_A_VENTA"] },
});
const FINANCIAMIENTO = metricas("2026-10", {
  financing_offers_ready: { value: 4, unit: "applications", quality: q("PARCIAL", 4, 4), reasons: ["FICHA_PARCIAL_POR_DEALER"] },
  finance_conversion_rate: { value: 25, unit: "percent", quality: q("VERIFICADA", 8, 8), reasons: [] },
});

const UUID = "11111111-1111-1111-1111-111111111111";
const permitido = { allowed: true, reason_code: null };
const TODO = { "autos.inventory.list": permitido, "autos.leads.crm": permitido, "credit.applications.view": permitido };

function montar(tenantId: string | null = UUID) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth = { tenant: tenantId ? { id: tenantId, slug: "mapaal", display_name: "Mapaal", subscribed_cores: [] } : null };
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth as never}>
        <CommandCenterV2 />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

function acceso(results: Record<string, unknown>) {
  (useAccessEntitlementsBatch as jest.Mock).mockReturnValue({ isPending: false, isLoading: false, isError: false, error: null, data: { results }, refetch: jest.fn() });
}

const visible = (el: HTMLElement) => {
  const c = el.cloneNode(true) as HTMLElement;
  c.querySelectorAll(".sr-only").forEach((n) => n.remove());
  return c.textContent ?? "";
};

describe("Command Center v2 (estructura de la referencia v3)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (selectedDealerIdentity as jest.Mock).mockReturnValue({ tenantId: "mapaal", dealerId: "d-1", organizationUnitId: null });
    (fetchUnidadesEnStock as jest.Mock).mockResolvedValue({ valor: 0, calidad: { estado: "parcial", cubiertos: null, total: null, motivo: "m" }, nota: "de 5 cargados · 5 en borrador", cargados: 5, borradores: 5 });
    (fetchLeadsTotal as jest.Mock).mockResolvedValue({ valor: 37, calidad: { estado: "verificado" }, nota: "Total histórico" });
    (fetchSolicitudesTotal as jest.Mock).mockResolvedValue({ valor: 12, calidad: { estado: "verificado" }, nota: "Total histórico" });
    (fetchMetricasInventario as jest.Mock).mockResolvedValue(INVENTARIO);
    (fetchMargenDelMes as jest.Mock).mockResolvedValue(MARGEN);
    (fetchMetricasLeadsDelMes as jest.Mock).mockResolvedValue(LEADS_MES);
    (fetchFinanciamientoDelMes as jest.Mock).mockResolvedValue(FINANCIAMIENTO);
  });

  it("orden: Brief, Estado del negocio, Cola, Salud, Hoy, Reportes", () => {
    acceso(TODO);
    montar();
    const ids = Array.from(document.querySelectorAll('[data-testid^="dcc-seccion-"]')).map((n) => n.getAttribute("data-testid"));
    expect(ids).toEqual(["dcc-seccion-brief", "dcc-seccion-negocio", "dcc-seccion-cola", "dcc-seccion-salud", "dcc-seccion-hoy", "dcc-seccion-reportes"]);
  });

  it("leads usa el UUID del tenant de /auth/me, no el slug del Local Storage", async () => {
    acceso(TODO);
    montar();
    await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-kpi-valor")).toHaveTextContent("37"));
    expect(fetchLeadsTotal).toHaveBeenCalledWith(UUID, "d-1");
  });

  it("sin UUID en la sesion no se pide la ruta de leads y se dice por que", () => {
    acceso(TODO);
    montar("mapaal");
    expect(fetchLeadsTotal).not.toHaveBeenCalled();
    expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error");
  });

  it("un error de carga lleva el codigo HTTP al tooltip", async () => {
    acceso(TODO);
    (fetchLeadsTotal as jest.Mock).mockRejectedValue({ status: 500, reason_code: null, message: "HTTP 500" });
    montar();
    await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-estado").getAttribute("title")).toContain("HTTP 500"));
  });

  it("Brief determinista con las cifras cargadas; Inventario distingue borradores", async () => {
    acceso(TODO);
    montar();
    await waitFor(() => expect(screen.getByTestId("dcc-brief")).toHaveTextContent("0 unidades en stock (5 en borrador de 5 cargadas), 37 leads en total y 12 solicitudes de crédito"));
    expect(within(screen.getByTestId("dcc-tarjeta-stock")).getByText("de 5 cargados · 5 en borrador")).toBeInTheDocument();
  });

  it("sin dato: compacto, solo 'Próximamente'; nada tecnico a la vista", () => {
    acceso(TODO);
    montar();
    for (const id of ["caja"]) {
      const t = screen.getByTestId(`dcc-tarjeta-${id}`);
      expect(within(t).getByTestId("dcc-sello")).toHaveTextContent("Próximamente");
      expect(within(t).queryByTestId("dcc-kpi-valor")).toBeNull();
      expect(visible(t)).not.toMatch(/Falta|endpoint|metric_key/);
    }
    for (const id of ["salud", "hoy"]) expect(visible(screen.getByTestId(`dcc-seccion-${id}`))).not.toMatch(/Falta|endpoint|\d/);
    expect(screen.getByTestId("dcc-seccion-cola")).toHaveTextContent("Sin alertas por ahora");
  });

  it("el acceso lo decide el backend: capability denegada = bloqueado, sin pedir datos", () => {
    acceso({ ...TODO, "autos.leads.crm": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
    montar();
    expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado");
    expect(fetchLeadsTotal).not.toHaveBeenCalled();
  });

  it("un 403 del endpoint pinta bloqueado, no error", async () => {
    acceso(TODO);
    (fetchSolicitudesTotal as jest.Mock).mockRejectedValue({ status: 403, reason_code: null });
    montar();
    await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-solicitudes")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado"));
  });

  describe("el lector de pantalla oye lenguaje llano, no rotulos tecnicos", () => {
    const TECNICO = /metric_key|GET \/api|\/api\//;

    /** Todo lo que puede llegar al arbol accesible: texto (sr-only incluido), title y aria-*. */
    function textoAccesible(raiz: HTMLElement): string[] {
      const partes = [raiz.textContent ?? ""];
      for (const el of [raiz, ...Array.from(raiz.querySelectorAll("*"))]) {
        for (const attr of Array.from(el.attributes)) {
          if (attr.name === "title" || attr.name.startsWith("aria-")) partes.push(`${attr.name}=${attr.value}`);
        }
      }
      return partes;
    }

    const sinTecnico = (raiz: HTMLElement) => {
      for (const parte of textoAccesible(raiz)) expect(parte).not.toMatch(TECNICO);
    };

    it("con cifras: ni metric_key ni GET /api en texto, title ni aria-*", async () => {
      acceso(TODO);
      const { container } = montar();
      await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-kpi-valor")).toHaveTextContent("37"));
      await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-solicitudes")).getByTestId("dcc-kpi-valor")).toHaveTextContent("12"));
      sinTecnico(container);
    });

    it("con error, bloqueo y sin dato: tampoco", async () => {
      acceso({ ...TODO, "autos.inventory.list": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
      (fetchLeadsTotal as jest.Mock).mockRejectedValue({ status: 500, reason_code: null, message: "HTTP 500" });
      (fetchSolicitudesTotal as jest.Mock).mockRejectedValue({ status: 403, reason_code: null });
      const { container } = montar();
      await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error"));
      await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-solicitudes")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado"));
      sinTecnico(container);
    });

    it("la descripcion accesible dice que mide la tarjeta", async () => {
      acceso(TODO);
      montar();
      const leads = screen.getByTestId("dcc-tarjeta-leads");
      await waitFor(() => expect(within(leads).getByTestId("dcc-kpi-valor")).toHaveTextContent("37"));
      // DccTooltip pone aria-describedby en su envoltorio del rotulo.
      const rotulo = (tarjeta: HTMLElement, texto: string) =>
        within(tarjeta).getByText(texto).closest('[data-testid="dcc-tooltip"]') as HTMLElement;
      expect(rotulo(leads, "Leads")).toHaveAccessibleDescription("Total de leads recibidos por tu concesionario.");
      await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-capital")).getByTestId("dcc-kpi-valor")).toBeInTheDocument());
      expect(rotulo(screen.getByTestId("dcc-tarjeta-capital"), "Capital")).toHaveAccessibleDescription(
        "Costo del inventario que tienes en stock.",
      );
    });

    it("el dato tecnico queda solo en data-* para soporte", () => {
      acceso(TODO);
      montar();
      const stock = screen.getByTestId("dcc-tarjeta-stock");
      expect(stock).toHaveAttribute("data-metric-key", "inventory_units@1.0");
      expect(stock.getAttribute("data-fuente")).toContain("GET /api/v1/autos/dealers/{dealer_id}/vehicles");
      expect(screen.getByTestId("dcc-tarjeta-caja")).not.toHaveAttribute("data-fuente");
    });
  });

  describe("F3-METRICAS: cifra y sello del backend", () => {
    const valor = (id: string) => within(screen.getByTestId(`dcc-tarjeta-${id}`)).getByTestId("dcc-kpi-valor");
    const sello = (id: string) => within(screen.getByTestId(`dcc-tarjeta-${id}`)).getByTestId("dcc-sello");

    it("capital, margen, dias e ingreso con su sello; el motivo del parcial va al tooltip", async () => {
      acceso(TODO);
      montar();
      await waitFor(() => expect(valor("capital")).toHaveTextContent(/182,4\s?M/));
      expect(fetchMetricasInventario).toHaveBeenCalledWith("d-1");
      expect(fetchMargenDelMes).toHaveBeenCalledWith("d-1");
      expect(sello("capital")).toHaveTextContent("parcial 12/14");
      expect(sello("capital").closest('[data-testid="dcc-tooltip"]')?.getAttribute("title")).toContain("sin costo de compra");
      await waitFor(() => expect(valor("margen")).toHaveTextContent(/23,2\s?M/));
      expect(sello("margen")).toHaveTextContent("parcial 3/4");
      expect(screen.getByTestId("dcc-tarjeta-margen")).toHaveTextContent("14,27 % de las ventas · Mes 2026-10");
      expect(valor("dias")).toHaveTextContent("37,4");
      expect(screen.getByTestId("dcc-tarjeta-dias")).toHaveTextContent("máximo 121 días");
      expect(sello("dias")).toHaveTextContent("verificado");
      expect(valor("ingreso")).toHaveTextContent(/241,9\s?M/);
    });

    it("NO_DISPONIBLE del backend: 'no disponible' (no 'Próximamente') y sin cifra", async () => {
      acceso(TODO);
      (fetchMargenDelMes as jest.Mock).mockResolvedValue(
        metricas("2026-10", { gross_margin: { value: null, unit: "ARS", quality: q("NO_DISPONIBLE", 0, 0), reasons: [] } }),
      );
      montar();
      await waitFor(() => expect(sello("margen")).toHaveTextContent("no disponible"));
      expect(sello("margen")).not.toHaveTextContent("Próximamente");
      expect(within(screen.getByTestId("dcc-tarjeta-margen")).queryByTestId("dcc-kpi-valor")).toBeNull();
      expect(sello("margen").closest('[data-testid="dcc-tooltip"]')?.getAttribute("title")).toContain("Sin ventas registradas este mes");
    });

    it("si las metricas fallan, solo caen sus tarjetas: el resto del panel sigue", async () => {
      acceso(TODO);
      (fetchMetricasInventario as jest.Mock).mockRejectedValue({ status: 503, reason_code: null, message: "HTTP 503" });
      (fetchMargenDelMes as jest.Mock).mockRejectedValue({ status: 404, reason_code: null });
      montar();
      await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-capital")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error"));
      expect(within(screen.getByTestId("dcc-tarjeta-margen")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error");
      await waitFor(() => expect(valor("leads")).toHaveTextContent("37"));
      expect(screen.getByTestId("dcc-brief")).toHaveTextContent("37 leads en total");
    });

    it("leads y financiamiento del mes: cifra y sello del backend (PARCIAL donde la ficha lo dice)", async () => {
      acceso(TODO);
      montar();
      await waitFor(() => expect(valor("respuesta")).toHaveTextContent("3,5"));
      expect(fetchMetricasLeadsDelMes).toHaveBeenCalledWith("d-1");
      expect(fetchFinanciamientoDelMes).toHaveBeenCalledWith("d-1");
      expect(sello("respuesta")).toHaveTextContent("parcial 8/10");
      expect(valor("conversion")).toHaveTextContent("12,5 %");
      await waitFor(() => expect(valor("ofertas")).toHaveTextContent("4"));
      expect(sello("ofertas")).toHaveTextContent("parcial 4/4");
      expect(valor("fondeo")).toHaveTextContent("25 %");
      expect(sello("fondeo")).toHaveTextContent("verificado");
    });

    it("sin credit.applications.view no se piden las metricas de financiamiento", () => {
      acceso({ ...TODO, "credit.applications.view": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
      montar();
      expect(sello("fondeo")).toHaveAttribute("data-estado", "bloqueado");
      expect(fetchFinanciamientoDelMes).not.toHaveBeenCalled();
    });

    it("sin autos.inventory.list no se piden las metricas", () => {
      acceso({ ...TODO, "autos.inventory.list": { allowed: false, reason_code: "UPGRADE_REQUIRED" } });
      montar();
      expect(sello("capital")).toHaveAttribute("data-estado", "bloqueado");
      expect(fetchMetricasInventario).not.toHaveBeenCalled();
      expect(fetchMargenDelMes).not.toHaveBeenCalled();
    });
  });

  it("si el batch de accesos falla, no hay cifras ni peticiones", () => {
    (useAccessEntitlementsBatch as jest.Mock).mockReturnValue({ isPending: false, isLoading: false, isError: true, error: new Error("x"), data: undefined, refetch: jest.fn() });
    montar();
    expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error");
    expect(fetchLeadsTotal).not.toHaveBeenCalled();
  });
});
