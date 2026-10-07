import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnaliticaV2 } from "@/components/credit-hub/bank-v2/analitica/AnaliticaV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: string[] = [];
let defaultCount = 12;
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string) => {
    llamadas.push(path);
    if (path.includes("dealers-ranking")) return { dealers: [{ dealer: "Autos del Caribe", volume: 94, approved: 67, approval_rate: 0.71 }] };
    if (path.includes("portfolio-health")) return {};
    return {
      applications_by_status: {}, approval_rate: 0.616, avg_decision_time_hours: null, top_dealers: [], portfolio_value: 284180000, total_applications: 352,
      default_prediction: { rule: "score_lt_600", predicted_default_count: defaultCount, predicted_default_rate: defaultCount / 352 },
      cohort_analysis: [{ period: "2026-09", applications: 120, approved: 74, approval_rate: 0.616 }],
    };
  }),
}));

function pintar() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AnaliticaV2 marca={marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco")} />
    </QueryClientProvider>,
  );
}

describe("Analitica v2 (B5)", () => {
  beforeEach(() => (llamadas.length = 0));

  it("mismas tres consultas; volumen de dealers como conteo; lo que falta, Proximamente", async () => {
    const { container } = pintar();
    expect(await screen.findByText("Autos del Caribe")).toBeInTheDocument();
    expect([...new Set(llamadas.map((p) => p.split("?")[0]))].sort()).toEqual([
      "/api/v2/credit/analytics/dashboard", "/api/v2/credit/analytics/dealers-ranking", "/api/v2/credit/analytics/portfolio-health",
    ]);
    const texto = (container.textContent ?? "").replace(/[\u00a0\u202f]/g, " ");
    expect(texto).toContain("RD$284.2 M");
    expect(texto).toContain("3.4 %");
    expect(texto).toContain("61.6 %");
    expect(texto).toContain("Incumplimiento previsto");
    expect(texto).not.toMatch(/Default predicho|\d%/);
    expect(container.textContent).not.toMatch(/RD\$94|score_lt_600|motor score|Error HTTP|DEMO|REAL/);
  });

  it("default extremo: no pinta la cifra", async () => {
    defaultCount = 352;
    const { container } = pintar();
    expect(await screen.findByText("Autos del Caribe")).toBeInTheDocument();
    expect(container.textContent).not.toContain("100.0 %");
    defaultCount = 12;
  });
});
