import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpedienteV2 } from "@/components/credit-hub/bank-v2/expediente/ExpedienteV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const ID = "7f3c1a10-0000-4000-8000-000000000002";
let analysis: Record<string, unknown> | undefined;
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href, ...r }: { children: React.ReactNode; href: string }) => <a href={href} {...r}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => {
  const real = jest.requireActual("@/lib/credit-hub/api/client");
  return {
    ...real,
    chFetch: jest.fn(async (path: string) => {
      if (path.includes("expediente/full")) throw new real.CHApiError("no", 404);
      if (path.includes("/compliance/")) return { consents_complete: true, documents_complete: true, issues: [] };
      if (path.endsWith("/events")) return { events: [] };
      return {
        application_id: ID, tenant_id: "t", state: "claimed",
        application_payload: { applicant: { name: "Solicitante Prueba" }, vehicle: { label: "Vehículo", dealer: "Dealer" }, financial: { requested_amount: 1000000, term_months: 48 }, analysis, documents: [] },
      };
    }),
  };
});

function montar() {
  const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ExpedienteV2 applicationId={ID} marca={marca} hrefVistaActual="/credit-hub/bank-v2/solicitudes/x/herramientas" hrefBandeja="/credit-hub/bank-v2" />
    </QueryClientProvider>,
  );
}

describe("detalle: botones", () => {
  it("primario y secundario, en cabecera y pie", async () => {
    analysis = undefined;
    montar();
    await screen.findByRole("heading", { name: "Solicitante Prueba" });
    const primarios = screen.getAllByRole("link", { name: "Abrir expediente completo" });
    const secundarios = screen.getAllByRole("link", { name: "Volver a la bandeja" });
    expect(primarios).toHaveLength(2);
    expect(secundarios).toHaveLength(2);
    primarios.forEach((l) => {
      expect(l).toHaveAttribute("href", "/credit-hub/bank-v2/solicitudes/x/herramientas");
      expect(l).toHaveAttribute("data-accion", "principal");
    });
    secundarios.forEach((l) => {
      expect(l).toHaveAttribute("href", "/credit-hub/bank-v2");
      expect(l).not.toHaveAttribute("data-accion");
    });
    expect(screen.getByTestId("expediente-acciones-cabecera")).toBeInTheDocument();
    expect(screen.getByTestId("expediente-acciones-pie")).toBeInTheDocument();
  });
});

describe("resumen del motor", () => {
  it("sin scoring: un solo aviso y ningún Próximamente", async () => {
    analysis = undefined;
    montar();
    await screen.findByRole("heading", { name: "Solicitante Prueba" });
    expect(screen.getAllByText("Scoring no disponible para este expediente")).toHaveLength(1);
    expect(within(screen.getByRole("region", { name: "Resumen del motor" })).queryByText(/Próximamente/i)).not.toBeInTheDocument();
  });
  it("con scoring: métricas con dato y sin aviso", async () => {
    analysis = { score: 742, risk_level: "BAJO", approval_band: "PREAPROBABLE", dti: 0.31 };
    montar();
    await screen.findByRole("heading", { name: "Solicitante Prueba" });
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Deuda / ingreso")).toBeInTheDocument();
    expect(screen.queryByText("Ingreso mensual")).not.toBeInTheDocument();
    expect(screen.queryByText("Scoring no disponible para este expediente")).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Resumen del motor" })).queryByText(/Próximamente/i)).not.toBeInTheDocument();
  });
});
