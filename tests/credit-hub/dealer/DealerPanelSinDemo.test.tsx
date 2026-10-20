import { render, screen, within } from "@testing-library/react";
import { DealerPipelineRail } from "@/components/credit-hub/dealer/elite/DealerPipelineRail";
import { DealerTrendsAlerts } from "@/components/credit-hub/dealer/elite/DealerTrendsAlerts";
import { DealerKpiStrip } from "@/components/credit-hub/dealer/elite/DealerKpiStrip";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

// DB-CODEX-16 paso 9 (Cowork 20-oct): sin datos reales, «no disponible»; nunca cifras de ejemplo con DEMO.
const apps = [
  { application_id: "APP-1", applicant_name: "Ana", status: "offered", requested_amount: 1000, currency: "DOP" },
  { application_id: "APP-2", applicant_name: "Luis", status: "draft", requested_amount: 1000, currency: "DOP" },
] as unknown as CreditApplication[];

describe("Panel del dealer sin cifras de ejemplo", () => {
  it("DealerPipelineRail: documentos y estipulaciones dicen «No disponible», sin DEMO", () => {
    render(<DealerPipelineRail applications={apps} currency="DOP" />);
    const rail = screen.getByTestId("dealer-pipeline-rail");
    expect(rail.querySelector('[data-truth="DEMO"]')).toBeNull();
    for (const label of ["Documentos solicitados", "Estipulaciones pendientes"]) {
      const card = within(rail).getByText(label).closest(".ch-card") as HTMLElement;
      expect(card).toHaveTextContent(/No disponible/);
      expect(card.textContent).not.toMatch(/\d/);
    }
  });

  it("DealerPipelineRail: sin resumen del backend el embudo dice «No disponible» en vez de ceros", () => {
    render(<DealerPipelineRail applications={apps} currency="DOP" />);
    const rail = screen.getByTestId("dealer-pipeline-rail");
    expect(within(rail).getByTestId("dealer-pipeline-unavailable")).toHaveTextContent(/No disponible/);
    expect(within(rail).queryByText("Borrador")).toBeNull();
  });

  it("DealerTrendsAlerts: sin serie real, ni 67 %, ni series ilustrativas, ni DEMO", () => {
    render(<DealerTrendsAlerts applications={apps} currency="DOP" pipelineAmountLabel="DOP 1,000" />);
    const section = screen.getByTestId("dealer-trends-alerts");
    expect(section.querySelector('[data-truth="DEMO"]')).toBeNull();
    expect(section.textContent).not.toMatch(/67\s?%/);
    expect(section.textContent).not.toMatch(/ilustrativ/i);
    expect(section.textContent).not.toMatch(/Meta de volumen/);
    expect(within(section).getAllByText(/No disponible/).length).toBeGreaterThanOrEqual(2);
  });

  it("DealerKpiStrip: sin resumen ni ranking, ni DEMO, ni mini-series ilustrativas, ni objetivos inventados", () => {
    render(<DealerKpiStrip pipelineAmount={1000} currency="DOP" weekCount={0} />);
    const strip = screen.getByTestId("dealer-kpi-strip");
    expect(strip.querySelector('[data-truth="DEMO"]')).toBeNull();
    expect(strip.querySelector('[aria-label="Tendencia ilustrativa demo"]')).toBeNull();
    expect(strip.textContent).not.toMatch(/objetivo/i);
  });
});
