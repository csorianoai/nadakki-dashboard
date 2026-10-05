import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { CommandCenterV2 } from "../CommandCenterV2";
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

const permitido = { allowed: true, reason_code: null };

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CommandCenterV2 />
    </QueryClientProvider>,
  );
}

function acceso(results: Record<string, unknown>) {
  (useAccessEntitlementsBatch as jest.Mock).mockReturnValue({ isPending: false, isLoading: false, isError: false, error: null, data: { results } });
}

describe("Command Center v2", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (selectedDealerIdentity as jest.Mock).mockReturnValue({ tenantId: "t-1", dealerId: "d-1", organizationUnitId: null });
    (fetchUnidadesEnStock as jest.Mock).mockResolvedValue({ valor: 1234, calidad: { estado: "parcial", cubiertos: null, total: null, motivo: "m" }, nota: "Disponibles y reservadas" });
    (fetchLeadsTotal as jest.Mock).mockResolvedValue({ valor: 42, calidad: { estado: "verificado" }, nota: "Total histórico" });
    (fetchSolicitudesTotal as jest.Mock).mockResolvedValue({ valor: 7, calidad: { estado: "verificado" }, nota: "Total histórico" });
  });

  it("conecta solo stock, leads y solicitudes, con el formato del tenant", async () => {
    acceso({ "autos.inventory.list": permitido, "autos.leads.crm": permitido, "credit.applications.view": permitido });
    montar();
    expect(screen.getByTestId("dcc-marca-nombre")).toHaveTextContent("Mapaal Automotores");
    await waitFor(() => expect(within(screen.getByTestId("dcc-tarjeta-stock")).getByTestId("dcc-kpi-valor")).toHaveTextContent("1.234"));
    expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-kpi-valor")).toHaveTextContent("42");
    expect(within(screen.getByTestId("dcc-tarjeta-solicitudes")).getByTestId("dcc-kpi-valor")).toHaveTextContent("7");
    expect(fetchLeadsTotal).toHaveBeenCalledWith("t-1", "d-1");
  });

  it("las tarjetas sin endpoint muestran 'aún no disponible' y ninguna cifra", () => {
    acceso({ "autos.inventory.list": permitido, "autos.leads.crm": permitido, "credit.applications.view": permitido });
    montar();
    for (const id of ["capital", "potencial", "caja", "dias", "margen", "respuesta", "conversion-leads", "ofertas", "fondeo"]) {
      const tarjeta = screen.getByTestId(`dcc-tarjeta-${id}`);
      expect(within(tarjeta).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "no_disponible");
      expect(within(tarjeta).queryByTestId("dcc-kpi-valor")).toBeNull();
    }
  });

  it("las secciones de la referencia sin fuente muestran su motivo y ningún dato", () => {
    acceso({ "autos.inventory.list": permitido, "autos.leads.crm": permitido, "credit.applications.view": permitido });
    montar();
    for (const id of ["brief", "cola", "salud", "hoy"]) {
      const seccion = screen.getByTestId(`dcc-seccion-${id}`);
      expect(within(seccion).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "no_disponible");
      expect(seccion.textContent).toMatch(/Falta endpoint/);
      expect(seccion.textContent).not.toMatch(/\d/);
    }
    expect(screen.getByTestId("dcc-seccion-negocio").querySelectorAll('[data-testid^="dcc-tarjeta-"]')).toHaveLength(6);
  });

  it("el acceso lo decide el backend: capability denegada = bloqueado, sin pedir datos", () => {
    acceso({ "autos.inventory.list": permitido, "autos.leads.crm": { allowed: false, reason_code: "UPGRADE_REQUIRED" }, "credit.applications.view": permitido });
    montar();
    const leads = screen.getByTestId("dcc-tarjeta-leads");
    expect(within(leads).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado");
    expect(fetchLeadsTotal).not.toHaveBeenCalled();
  });

  it("sin decision del backend para una capability, no se abre (fail-closed)", () => {
    acceso({ "autos.inventory.list": permitido, "autos.leads.crm": permitido });
    montar();
    expect(within(screen.getByTestId("dcc-tarjeta-solicitudes")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado");
    expect(fetchSolicitudesTotal).not.toHaveBeenCalled();
  });

  it("un 403 del endpoint pinta bloqueado, no error ni cifra", async () => {
    acceso({ "autos.inventory.list": permitido, "autos.leads.crm": permitido, "credit.applications.view": permitido });
    (fetchSolicitudesTotal as jest.Mock).mockRejectedValue({ status: 403, reason_code: null });
    montar();
    await waitFor(() =>
      expect(within(screen.getByTestId("dcc-tarjeta-solicitudes")).getByTestId("dcc-sello")).toHaveAttribute("data-estado", "bloqueado"),
    );
  });

  it("si el batch de accesos falla, las tarjetas conectadas muestran error, no cifras", () => {
    (useAccessEntitlementsBatch as jest.Mock).mockReturnValue({ isPending: false, isLoading: false, isError: true, error: new Error("x"), data: undefined, refetch: jest.fn() });
    montar();
    expect(within(screen.getByTestId("dcc-tarjeta-leads")).getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error");
    expect(fetchLeadsTotal).not.toHaveBeenCalled();
  });
});
