import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BankAnalyticsPage from "@/app/bank/analytics/page";
import BankAnalyticsRouteLayout from "@/app/bank/analytics/layout";
import { BankPortfolioDashboard } from "@/components/bank/analytics/BankPortfolioDashboard";
import { AnomaliesPanel } from "@/components/bank/analytics/AnomaliesPanel";
import * as bankApi from "@/lib/bank/analytics-api";
import type { BankAnalytics } from "@/types/bank-analytics";

jest.mock("@/lib/bank/analytics-api", () => ({
  ...jest.requireActual("@/lib/bank/analytics-api"),
  getBankAnalytics: jest.fn(),
}));

const SAMPLE_BANK_ANALYTICS: BankAnalytics = {
  portfolioOverview: {
    totalExposure: 890_430,
    activeApplications: 128,
    approvalRate: 62.44,
    stipulationsFrequency: 18,
  },
  riskHeatmap: {
    cells: [
      {
        amountBucket: "250k–500k",
        riskBucket: "70–85",
        volume: 42,
        color: "",
      },
      {
        amountBucket: "0–50k",
        riskBucket: "0–30",
        volume: 11,
        color: "#9333EA",
      },
    ],
  },
  decisionDistribution: {
    approved: 36,
    declined: 9,
    pending: 4,
    withdrawn: 1,
  },
  stipulationsFrequency: {
    topStipulations: [
      { name: "Cliente verificado cedula@mail.com extra", count: 16, percent: 24 },
      { name: "Seguro garantía", count: 9, percent: 12 },
    ],
  },
  anomalies: [
    {
      id: "a1b2",
      type: "VELOCITY",
      severity: "critical",
      description: "Pico ante cédula 402-1234567-8 cliente@risk.test",
      detectedAt: new Date().toISOString(),
    },
  ],
};

describe("Bank portfolio analytics dashboard", () => {
  const priorFlag = process.env.NEXT_PUBLIC_FEATURE_BANK_ANALYTICS;

  beforeEach(() => {
    localStorage.clear();
    process.env.NEXT_PUBLIC_FEATURE_BANK_ANALYTICS = "true";
    jest.mocked(bankApi.getBankAnalytics).mockReset();
    jest.mocked(bankApi.getBankAnalytics).mockResolvedValue(SAMPLE_BANK_ANALYTICS);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_BANK_ANALYTICS = priorFlag;
    jest.mocked(bankApi.getBankAnalytics).mockReset();
    localStorage.clear();
  });

  test("feature flag disables route shell when OFF", async () => {
    process.env.NEXT_PUBLIC_FEATURE_BANK_ANALYTICS = "false";

    render(
      <BankAnalyticsRouteLayout>
        <span data-testid="kids">blocked</span>
      </BankAnalyticsRouteLayout>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("bank-analytics-flag-off")).toBeVisible(),
    );
    expect(screen.queryByTestId("kids")).not.toBeInTheDocument();
  });

  test("route layout denies dealers before analytics tree mounts", async () => {
    localStorage.setItem("nadakki_role", "dealer");

    render(
      <BankAnalyticsRouteLayout>
        <span data-testid="kids">secret</span>
      </BankAnalyticsRouteLayout>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("bank-analytics-access-denied")).toBeVisible(),
    );
    expect(screen.queryByTestId("kids")).not.toBeInTheDocument();
  });

  test("route layout renders children for bank admin storage profile", async () => {
    localStorage.setItem("nadakki_role", "admin");

    render(
      <BankAnalyticsRouteLayout>
        <span data-testid="kids">ok</span>
      </BankAnalyticsRouteLayout>,
    );

    await waitFor(() => expect(screen.getByTestId("kids")).toHaveTextContent("ok"));
  });

  test("dashboard shows KPI values after successful fetch", async () => {
    localStorage.setItem("nadakki_role", "viewer");

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByTestId("bank-kpi-exposure")).toHaveTextContent(/890/);
      expect(screen.getByTestId("bank-kpi-active-apps")).toHaveTextContent("128");
    });
  });

  test("bank role chip reflects BANK_ADMIN when storage maps to admin", async () => {
    localStorage.setItem("nadakki_role", "tenant_admin");

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    await waitFor(() =>
      expect(screen.getByTestId("bank-dashboard-role-chip")).toHaveTextContent("BANK_ADMIN"),
    );
  });

  test("heatmap scatter receives normalized bucket cells", async () => {
    localStorage.setItem("nadakki_role", "bank_analyst");

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByTestId("risk-heatmap")).toBeInTheDocument();
      expect(screen.getByTestId("risk-heatmap-points")).toBeInTheDocument();
    });
  });

  test("anomalies detail masks cédula and email fragments", () => {
    render(<AnomaliesPanel items={SAMPLE_BANK_ANALYTICS.anomalies} loading={false} />);

    expect(screen.getByText(/Pico ante cédula/)).toBeInTheDocument();
    expect(screen.queryByText(/402-1234567-8/)).not.toBeInTheDocument();
    expect(screen.queryByText(/cliente@risk\.test/)).not.toBeInTheDocument();
  });

  test("anomalies list renders severity badge for critical items", () => {
    render(<AnomaliesPanel items={SAMPLE_BANK_ANALYTICS.anomalies} loading={false} />);

    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  test("stipulations bar click surfaces filter cue for analysts", async () => {
    localStorage.setItem("nadakki_role", "viewer");

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    await screen.findByTestId("stipulations-frequency");
    await userEvent.click(screen.getByTestId("stipulation-chip-1"));

    await waitFor(() =>
      expect(screen.getByText(/Selección rápida:/i)).toBeInTheDocument(),
    );
  });

  test("period change asks API for new window", async () => {
    localStorage.setItem("nadakki_role", "viewer");

    render(<BankAnalyticsPage />);

    await waitFor(() => expect(bankApi.getBankAnalytics).toHaveBeenCalledWith("30d"));

    await userEvent.click(within(screen.getByTestId("bank-period-selector")).getByRole("button", { name: /^7d$/ }));

    await waitFor(() => expect(bankApi.getBankAnalytics).toHaveBeenCalledWith("7d"));
  });

  test("refresh button triggers another fetch for same period", async () => {
    localStorage.setItem("nadakki_role", "viewer");

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    await waitFor(() => expect(bankApi.getBankAnalytics).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByTestId("bank-analytics-refresh"));

    await waitFor(() => expect(bankApi.getBankAnalytics).toHaveBeenCalledTimes(2));
  });

  test("API errors expose retry control", async () => {
    localStorage.setItem("nadakki_role", "viewer");
    jest
      .mocked(bankApi.getBankAnalytics)
      .mockRejectedValueOnce(new Error("Bank analytics fetch failed: 503"))
      .mockResolvedValueOnce(SAMPLE_BANK_ANALYTICS);

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    await screen.findByTestId("bank-analytics-error");
    await userEvent.click(screen.getByTestId("bank-analytics-error-retry"));

    await waitFor(() => expect(bankApi.getBankAnalytics).toHaveBeenCalledTimes(2));
  });

  test("empty analytics payload shows consolidated empty state", async () => {
    localStorage.setItem("nadakki_role", "viewer");
    jest.mocked(bankApi.getBankAnalytics).mockResolvedValueOnce({
      portfolioOverview: {
        totalExposure: 0,
        activeApplications: 0,
        approvalRate: 0,
        stipulationsFrequency: 0,
      },
      riskHeatmap: { cells: [] },
      decisionDistribution: {
        approved: 0,
        declined: 0,
        pending: 0,
        withdrawn: 0,
      },
      stipulationsFrequency: { topStipulations: [] },
      anomalies: [],
    });

    render(<BankPortfolioDashboard period="30d" onPeriodChange={() => undefined} />);

    expect(await screen.findByTestId("bank-analytics-empty-state")).toBeVisible();
  });
});
