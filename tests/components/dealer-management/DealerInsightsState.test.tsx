/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DealerInsightsPage from "@/app/autos/dealer/insights/page";
import { getDealerInsights } from "@/lib/api/dealer-insights";
import { getDealerId } from "@/lib/api/dealer-leads";

jest.mock("@/lib/api/dealer-leads", () => ({ getDealerId: jest.fn() }));
jest.mock("@/lib/api/dealer-insights", () => ({
  getDealerInsights: jest.fn(),
  regenerateInsights: jest.fn(),
  downloadWeeklyReportPdf: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn(), message: jest.fn() },
}));

const mockedDealerId = getDealerId as jest.MockedFunction<typeof getDealerId>;
const mockedGetInsights = getDealerInsights as jest.MockedFunction<typeof getDealerInsights>;

describe("DealerInsights terminal states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sin dealer termina loading y muestra estado vacio", async () => {
    mockedDealerId.mockReturnValue(null);

    render(<DealerInsightsPage />);

    expect(await screen.findByText("Selecciona un dealer para ver sus insights.")).toBeInTheDocument();
    expect(screen.queryByText("Cargando insights…")).not.toBeInTheDocument();
    expect(mockedGetInsights).not.toHaveBeenCalled();
  });

  test("error de backend termina loading y permite reintentar", async () => {
    mockedDealerId.mockReturnValue("dealer-1");
    mockedGetInsights
      .mockRejectedValueOnce(new Error("backend down"))
      .mockRejectedValueOnce(new Error("backend down again"));

    render(<DealerInsightsPage />);

    expect(await screen.findByText("No se pudieron cargar los insights.")).toBeInTheDocument();
    expect(screen.queryByText("Cargando insights…")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(mockedGetInsights).toHaveBeenCalledTimes(2));
  });
});
