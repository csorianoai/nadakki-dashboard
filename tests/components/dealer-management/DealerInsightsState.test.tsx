/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import DealerInsightsPage from "@/app/autos/dealer/insights/page";
import { getDealerInsights } from "@/lib/api/dealer-insights";

jest.mock("@/lib/api/dealer-insights", () => ({ getDealerInsights: jest.fn() }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS" } }),
}));

describe("Insights del dealer sin backend", () => {
  test("muestra Próximamente y no pide ni pinta datos de ejemplo", () => {
    render(<DealerInsightsPage />);
    expect(screen.getByText("Próximamente")).toBeInTheDocument();
    expect(getDealerInsights).not.toHaveBeenCalled();
    const texto = document.body.textContent ?? "";
    for (const prohibido of ["DEMO", "Performance Overview", "RD$", "Credicefi", "+1 809", "Descargar PDF", "Regenerar"]) {
      expect(texto).not.toContain(prohibido);
    }
  });
});
