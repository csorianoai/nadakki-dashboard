import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { CommandCenterV2 } from "../CommandCenterV2";
import { AuthContext } from "@/lib/auth/auth-context";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchLeadsTotal, fetchSolicitudesTotal, fetchUnidadesEnStock } from "@/lib/dcc/inicio";

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
    for (const id of ["capital", "margen", "caja"]) {
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

  it("si el batch de accesos falla, no hay cifras ni peticiones", () => {
    (useAccessEntitlementsBatch as jest.Mock).mockReturnValue({ isPending: false, isLoading: false, isError: true, error: new Error("x"), data: undefined, refetch: jest.fn() });
    montar();
    expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error");
    expect(fetchLeadsTotal).not.toHaveBeenCalled();
  });
});
