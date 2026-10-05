import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DealerLeadsPage from "../page";
import { AuthContext } from "@/lib/auth/auth-context";
import { apiFetch } from "@/lib/api/fetch-client";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/dealer/access-context", () => ({ selectedDealerIdentity: jest.fn() }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS" } }),
}));

const UUID = "11111111-1111-1111-1111-111111111111";
const RUTA = `/api/v1/autos/tenants/${UUID}/dealers/d-1/leads?page=1&page_size=20`;

function respuesta(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function lead(id: string) {
  return {
    id,
    buyer_name: `Comprador ${id}`,
    buyer_phone: "+54 11 5555-0000",
    buyer_email: null,
    buyer_message: "Consulta por la unidad",
    source: "web",
    status: "new",
    priority: "high",
    finance_interested: true,
    monthly_budget_rd: 50000,
    created_at: "2026-10-01T12:00:00Z",
  };
}

function montar(tenantId: string | null = UUID) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth = { tenant: tenantId ? { id: tenantId, slug: "mapaal", display_name: "Mapaal", subscribed_cores: [] } : null };
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth as never}>
        <DealerLeadsPage />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

const PROHIBIDOS = ["DEMO", "+1 809", "RD$", "Credicefi", "Performance Overview"];
const sinDemo = () => {
  const texto = document.body.textContent ?? "";
  for (const p of PROHIBIDOS) expect(texto).not.toContain(p);
};

describe("Leads del dealer (backend real)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (selectedDealerIdentity as jest.Mock).mockReturnValue({ tenantId: "mapaal", dealerId: "d-1", organizationUnitId: null });
  });

  it("llama a la ruta real con el UUID del tenant y el dealer, y pluraliza", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(respuesta(200, { leads: [lead("a"), lead("b")], total: 2, page: 1, page_size: 20, has_next: false }));
    montar();
    expect(await screen.findByTestId("leads-total")).toHaveTextContent("2 leads en total");
    expect(apiFetch).toHaveBeenCalledWith(RUTA, expect.anything());
    expect(screen.getAllByTestId("lead-fila")).toHaveLength(2);
    expect(screen.getByText("Comprador a")).toBeInTheDocument();
    sinDemo();
  });

  it("un solo lead dice '1 lead', no '1 leads'", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(respuesta(200, { leads: [lead("a")], total: 1, page: 1, page_size: 20, has_next: false }));
    montar();
    expect(await screen.findByTestId("leads-total")).toHaveTextContent("1 lead en total");
    expect(screen.getByTestId("leads-total").textContent).not.toContain("1 leads");
  });

  it("sin leads muestra el estado vacio honesto", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(respuesta(200, { leads: [], total: 0, page: 1, page_size: 20, has_next: false }));
    montar();
    expect(await screen.findByText("Todavía no hay leads.")).toBeInTheDocument();
    sinDemo();
  });

  it("si falla, muestra el mismo error humano del Command Center y permite reintentar", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(respuesta(500, { detail: "boom" }));
    montar();
    await waitFor(() => expect(screen.getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error"));
    expect(screen.getByText("No se pudo cargar. Vuelve a intentarlo.")).toBeInTheDocument();
    expect(screen.getByTestId("dcc-estado").getAttribute("title")).toContain("HTTP 500");
    sinDemo();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
  });

  it("sin UUID en la sesion no se pide la ruta y no se inventan datos", () => {
    montar("mapaal");
    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByTestId("dcc-estado")).toHaveAttribute("data-estado", "error");
    sinDemo();
  });
});
