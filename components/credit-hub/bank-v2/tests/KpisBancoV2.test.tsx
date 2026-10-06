import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KpisBancoV2 } from "@/components/credit-hub/bank-v2/kpis/KpisBancoV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: Array<{ path: string; tenant?: string }> = [];
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(async (path: string, init: { headers: Record<string, string> }) => {
    llamadas.push({ path, tenant: init.headers["X-Tenant-ID"] });
    const body = path.includes("summary")
      ? { summary: { applications_total: 352, offers_by_lender: {}, applications_by_status: { submitted: 31, RARO_X: 4 } } }
      : path.includes("lenders")
        ? { lenders: [{ lender_name: "Banco Ejemplo", applications: 120, approved: 74 }] }
        : { available: false, error: "trends timeout" };
    return { ok: true, status: 200, text: async () => JSON.stringify(body) };
  }),
}));

it("KPIs v2: mismas rutas y tenant; sin ceros inventados; available:false es Proximamente", async () => {
  const { container } = render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <KpisBancoV2 marca={marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco")} />
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Banco Ejemplo")).toBeInTheDocument();
  expect(await screen.findByText(/Pendiente: 31/)).toBeInTheDocument();
  expect(llamadas.map((l) => `${l.path}|${l.tenant}`).sort()).toEqual([
    "/api/v2/credit/bank/kpis/lenders|t-1", "/api/v2/credit/bank/kpis/trends|t-1", "/credit/dashboard/summary|t-1",
  ]);
  // Lo visible, sin los tooltips (el detalle tecnico va solo ahi).
  const visible = container.cloneNode(true) as HTMLElement;
  visible.querySelectorAll(".sr-only").forEach((n) => n.remove());
  const texto = visible.textContent ?? "";
  expect(texto).toContain("Próximamente");
  expect(texto).not.toMatch(/RARO_X|trends timeout|Error HTTP|available/);
  // Ofertas y fallos no vinieron: no se pintan como 0.
  expect(screen.getAllByTestId("dcc-kpi-valor").map((n) => n.textContent)).toEqual(["352"]);
});
