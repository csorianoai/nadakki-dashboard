import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DealerAnalyticsPage from "@/app/credit/dealer/analytics/page";
import type { DealerAnalytics } from "@/types/dealer-analytics";
import {
  exportAnalyticsCSV,
  downloadExportedBlob,
  getDealerAnalytics,
  isDealerAnalyticsEnabled,
} from "@/lib/dealer/analytics-api";

jest.mock("@/components/credit/dealer/analytics/ConversionFunnel", () => ({
  ConversionFunnel: ({
    funnel,
  }: {
    funnel: DealerAnalytics["conversionFunnel"];
  }) => (
    <div role="figure" aria-label="Embudo de conversión dealer" data-testid="conversion-funnel">
      <span data-stage="started">Started: {funnel.started}</span>
      <span data-stage="submitted">Submitted: {funnel.submitted}</span>
      <span data-stage="approved">Approved: {funnel.approved}</span>
      <span data-stage="closed">Closed: {funnel.closed}</span>
    </div>
  ),
  ConversionFunnelSkeleton: () => <div data-testid="conversion-funnel-skeleton" />,
}));

jest.mock("@/lib/dealer/analytics-api", () => ({
  ...jest.requireActual("@/lib/dealer/analytics-api"),
  getDealerAnalytics: jest.fn(),
  exportAnalyticsCSV: jest.fn(),
  downloadExportedBlob: jest.fn(),
  isDealerAnalyticsEnabled: jest.fn(),
}));

const mockGetDealerAnalytics = jest.mocked(getDealerAnalytics);
const mockExport = jest.mocked(exportAnalyticsCSV);
const mockDownload = jest.mocked(downloadExportedBlob);
const mockFlag = jest.mocked(isDealerAnalyticsEnabled);

export const SAMPLE_DEALER_ANALYTICS: DealerAnalytics = {
  conversionFunnel: {
    started: 240,
    submitted: 180,
    approved: 120,
    closed: 90,
    dropOffPercents: [
      { stage: "Submitted", dropOff: 0.25 },
      { stage: "Approved", dropOff: 0.333 },
      { stage: "Closed", dropOff: 0.25 },
    ],
  },
  timeToClose: {
    weeklyAverages: [
      { week: "2025-W10", avgDays: 14 },
      { week: "2025-W11", avgDays: 11 },
      { week: "2025-W12", avgDays: 9 },
    ],
    currentAvg: 9,
    trend: "down",
  },
  approvalRateByBucket: {
    byAmount: [
      { range: "0–300k RD$", rate: 71.5, count: 40 },
      { range: "300k+", rate: 64.2, count: 18 },
    ],
    byTerm: [{ range: "36m", rate: 68.0, count: 22 }],
    byRiskTier: [{ tier: "Standard", rate: 62.0, count: 30 }],
  },
  performanceMetrics: {
    avgDealSize: 425_900,
    totalVolume: 5_050_500,
    approvalRate: 65.25,
    npsScore: 48,
  },
};

describe("Dealer analytics dashboard integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlag.mockReturnValue(true);
    mockExport.mockResolvedValue(new Blob(["ok"], { type: "text/csv" }));
    mockDownload.mockImplementation(() => undefined);
  });

  test("dashboard shows KPI skeletons while initial fetch is pending", async () => {
    mockGetDealerAnalytics.mockImplementationOnce(() => new Promise(() => undefined));
    render(<DealerAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dealer-performance-skeleton")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("conversion-funnel-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("time-to-close-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("approval-rate-skeleton")).toBeInTheDocument();
    });
  });

  test("calls getDealerAnalytics on mount with default 30d", async () => {
    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);

    await waitFor(() => {
      expect(mockGetDealerAnalytics).toHaveBeenCalledWith("30d");
      expect(mockGetDealerAnalytics).toHaveBeenCalledTimes(1);
    });
  });

  test("period selector is disabled when API has no temporal filter", async () => {
    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);
    await waitFor(() => expect(screen.getByTestId("dealer-period-unavailable")).toBeVisible());

    const periodButton = within(screen.getByTestId("dealer-period-selector")).getByRole("button", { name: /^7d$/ });
    expect(periodButton).toBeDisabled();
    expect(mockGetDealerAnalytics).toHaveBeenCalledTimes(1);
  });

  test("performance KPI cards resolve to expected values after load", async () => {
    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);

    await waitFor(() => expect(screen.getByTestId("dealer-kpi-deal-size")).toHaveTextContent(/425[\s.,]?900/));
    expect(screen.getByTestId("dealer-kpi-volume").textContent).toMatch(/5[\s.,]?050/);
    expect(screen.getByTestId("dealer-kpi-approval")).toHaveTextContent("65.3%");
    expect(screen.getByTestId("dealer-kpi-nps")).toHaveTextContent("48");
  });

  test("conversion funnel exposes four sequential stages after load", async () => {
    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);

    const funnelRegion = await screen.findByRole("figure", {
      name: /Embudo de conversión dealer/i,
    });

    await waitFor(() => {
      expect(within(funnelRegion).getByText(/Started: 240/)).toBeInTheDocument();
      expect(within(funnelRegion).getByText(/Submitted: 180/)).toBeInTheDocument();
      expect(within(funnelRegion).getByText(/Approved: 120/)).toBeInTheDocument();
      expect(within(funnelRegion).getByText(/Closed: 90/)).toBeInTheDocument();
    });
  });

  test("analytics error exposes retry affordance bound to refetch", async () => {
    mockGetDealerAnalytics
      .mockRejectedValueOnce(new Error("Analytics fetch failed: 503"))
      .mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);

    render(<DealerAnalyticsPage />);

    await screen.findByTestId("dealer-analytics-error");
    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    await userEvent.click(screen.getByTestId("dealer-error-retry"));

    await waitFor(() =>
      expect(mockGetDealerAnalytics).toHaveBeenCalledTimes(2),
    );
    await screen.findByTestId("performance-metrics-cards");
  });

  test("export invokes CSV helpers with current period blob", async () => {
    mockGetDealerAnalytics.mockResolvedValue(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);
    await screen.findByTestId("dealer-export-csv");

    await userEvent.click(screen.getByTestId("dealer-export-csv"));

    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith("30d");
      expect(mockDownload).toHaveBeenCalled();
    });

    expect(mockExport).toHaveBeenCalledTimes(1);
  });

  test("narrow viewport renders dashboard chrome (375px emulation)", async () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    window.dispatchEvent(new Event("resize"));

    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);

    await screen.findByTestId("dealer-analytics-dashboard");
    expect(within(screen.getByTestId("dealer-period-selector")).getAllByRole("button")).toHaveLength(4);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth });
    window.dispatchEvent(new Event("resize"));
  });

  test("empty backend payload shows centralized empty cue", async () => {
    const empty: DealerAnalytics = {
      conversionFunnel: { started: 0, submitted: 0, approved: 0, closed: 0, dropOffPercents: [] },
      timeToClose: { weeklyAverages: [], currentAvg: 0, trend: "stable" },
      approvalRateByBucket: { byAmount: [], byTerm: [], byRiskTier: [] },
      performanceMetrics: { avgDealSize: 0, totalVolume: 0, approvalRate: 0, npsScore: 0 },
    };
    mockGetDealerAnalytics.mockResolvedValueOnce(empty);
    render(<DealerAnalyticsPage />);

    expect(await screen.findByTestId("dealer-analytics-empty")).toHaveTextContent(
      /No hay actividad en el periodo seleccionado/i,
    );
  });

  test("refresh button triggers another summary fetch", async () => {
    mockGetDealerAnalytics.mockResolvedValue(SAMPLE_DEALER_ANALYTICS);
    render(<DealerAnalyticsPage />);
    await screen.findByTestId("dealer-export-csv");

    await waitFor(() => expect(mockGetDealerAnalytics.mock.calls.length).toBeGreaterThanOrEqual(1));
    mockGetDealerAnalytics.mockResolvedValueOnce(SAMPLE_DEALER_ANALYTICS);
    await userEvent.click(screen.getByTestId("dealer-refresh"));

    await waitFor(() =>
      expect(mockGetDealerAnalytics.mock.calls.filter((call) => call[0] === "30d").length).toBeGreaterThanOrEqual(2),
    );
  });

  test("feature flag disables analytics shell contents", async () => {
    mockFlag.mockReturnValueOnce(false);
    render(<DealerAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dealer-analytics-flag-off")).toBeVisible();
      expect(screen.queryByTestId("dealer-analytics-dashboard")).not.toBeInTheDocument();
    });
  });
});
