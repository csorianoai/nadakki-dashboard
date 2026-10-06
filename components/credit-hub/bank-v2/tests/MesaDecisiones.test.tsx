import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MesaDecisiones } from "@/components/credit-hub/bank-v2/mesa/MesaDecisiones";
import { colaPorUrgencia, recomendacion, saludo } from "@/components/credit-hub/bank-v2/mesa/mesa";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

const fila = (id: string, priority: BankQueueItem["priority"], score: number, extra: Partial<BankQueueItem> = {}): BankQueueItem => ({
  application_id: id, tenant_id: "t", state: "submitted", applicant_name: `Persona ${id}`, dealer_id: null, dealer_name: "Autos del Caribe",
  vehicle_label: "Toyota RAV4 2024", requested_amount: 2150000, score, risk_level: "BAJO", approval_band: "PREAPROBABLE", priority, created_at: null, bank_decision: null, ...extra,
});
const COLA = [fila("b", "MEDIA", 790), fila("a", "ALTA", 700), fila("c", "ALTA", 760, { approval_band: "NO_RECOMENDADO" }), fila("d", "ALTA", 800, { state: "decided" })];
const llamadas: string[] = [];

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", loading: false }) }));
jest.mock("@/components/credit-hub/shell/useChromeIdentity", () => ({ useChromeIdentity: () => ({ name: "Laura Méndez", initials: "LM", email: "", role: "" }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href, ...r }: { children: React.ReactNode; href: string }) => <a href={href} {...r}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string) => {
    llamadas.push(path.split("?")[0]);
    if (path.includes("applications/queue")) return { applications: COLA, total: 4, tenant_id: "t" };
    if (path.includes("analytics/dashboard")) return { applications_by_status: { submitted: 3 }, approval_rate: 0.6, top_dealers: [] };
    if (path.includes("kpis/portfolio")) return { total_approved_amount: 284180000 };
    return { approved_count: 196, avg_response_hours: null };
  }),
}));

describe("Mesa de decisiones v2 (B3)", () => {
  it("saludo por hora, urgencia por prioridad y score, accion de la banda del motor", () => {
    expect([6, 11, 12, 18, 19, 3].map((h) => saludo(new Date(2026, 9, 5, h)))).toEqual(["Buenos días", "Buenos días", "Buenas tardes", "Buenas tardes", "Buenas noches", "Buenas noches"]);
    expect(colaPorUrgencia(COLA).map((i) => i.application_id)).toEqual(["c", "a", "b"]);
    expect(recomendacion("NO_RECOMENDADO").accion).toBe("Rechazar con motivo");
    expect(recomendacion(null).accion).toBe("Revisar expediente");
  });

  it("mismas llamadas que la Mesa actual, importes del branding y sin textos tecnicos", async () => {
    const marca = marcaDesdeBranding({ display_name: "Banco Ejemplo", locale: "es-DO", currency: "DOP" }, "banco");
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MesaDecisiones marca={marca} hrefSolicitud={(id) => `/s/${id}`} hrefBandeja="/b" hrefAnalitica="/a" ahora={new Date(2026, 9, 5, 14, 30)} />
      </QueryClientProvider>,
    );
    const cola = await screen.findAllByTestId("cola-tarjeta");
    expect(cola).toHaveLength(3);
    expect(screen.getByTestId("mesa-saludo")).toHaveTextContent("Buenas tardes, Laura.");
    expect(within(cola[0]).getByTestId("cola-accion")).toHaveTextContent("Rechazar con motivo");
    expect(within(cola[0]).getByTestId("cola-accion")).toHaveAttribute("href", "/s/c");
    expect(cola[0].textContent).toContain("RD$2,150,000.00");
    expect(await screen.findByText("RD$284.2 M")).toBeInTheDocument();
    expect([...new Set(llamadas)].sort()).toEqual([
      "/api/v2/credit/analytics/dashboard", "/api/v2/credit/applications/queue", "/api/v2/credit/bank/kpis/approval", "/api/v2/credit/bank/kpis/portfolio",
    ]);
    const texto = container.textContent ?? "";
    expect(texto).not.toMatch(/Error HTTP|DEMO|ROADMAP|undefined|NaN|[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });

  it("si el backend falla no inventa ceros: pide reintentar", async () => {
    const { chFetch } = jest.requireMock("@/lib/credit-hub/api/client");
    (chFetch as jest.Mock).mockRejectedValue(new Error("503"));
    const marca = marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco");
    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MesaDecisiones marca={marca} hrefSolicitud={(id) => `/s/${id}`} hrefBandeja="/b" hrefAnalitica="/a" />
      </QueryClientProvider>,
    );
    expect((await screen.findAllByRole("button", { name: "Reintentar" })).length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[data-testid=dcc-kpi-valor]")).toHaveLength(0);
  });
});
