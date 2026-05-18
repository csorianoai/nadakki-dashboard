import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetricsRefreshIndicator } from "@/components/admin/observability/MetricsRefreshIndicator";
import { AuditTrailTable } from "@/components/admin/observability/AuditTrailTable";
import { LatencyHistogram } from "@/components/admin/observability/LatencyHistogram";
import { TenantComparison } from "@/components/admin/observability/TenantComparison";
import { ErrorRateTimeSeries } from "@/components/admin/observability/ErrorRateTimeSeries";
import { SLABreachAlert } from "@/components/admin/observability/SLABreachAlert";

describe("MetricsRefreshIndicator", () => {
  test("renders polling interval and test id", () => {
    render(
      <MetricsRefreshIndicator dataUpdatedAt={Date.now() - 8000} isValidating={false} refreshIntervalMs={30_000} />,
    );
    expect(screen.getByTestId("metrics-refresh-indicator")).toBeInTheDocument();
    expect(screen.getByText(/polling 30s/i)).toBeInTheDocument();
  });

  test("shows network hint when error passed", () => {
    render(
      <MetricsRefreshIndicator dataUpdatedAt={Date.now()} isValidating={false} error={new Error("x")} />,
    );
    expect(screen.getByText(/error de red/i)).toBeInTheDocument();
  });
});

describe("AuditTrailTable", () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    ts: new Date(2026, 0, i + 1).toISOString(),
    actor: i % 2 ? "analyst" : "admin",
    action: i === 3 ? "risk.review" : "credit.decide",
    resource: `app/${i}`,
    status: "200",
  }));

  test("filters rows by query", async () => {
    const user = userEvent.setup();
    render(<AuditTrailTable rows={rows} pageSize={4} />);
    await user.type(screen.getByTestId("audit-trail-filter"), "risk.review");
    expect(screen.getByText("risk.review")).toBeInTheDocument();
    expect(screen.queryByText("credit.decide")).not.toBeInTheDocument();
  });

  test("paginates with next", async () => {
    const user = userEvent.setup();
    render(<AuditTrailTable rows={rows} pageSize={5} />);
    expect(screen.getByText(/página 1\//)).toBeInTheDocument();
    await user.click(screen.getByTestId("audit-trail-next"));
    expect(screen.getByText(/página 2\//)).toBeInTheDocument();
  });
});

describe("LatencyHistogram", () => {
  test("renders empty state without data", () => {
    render(<LatencyHistogram endpoints={[]} />);
    expect(screen.getByTestId("latency-histogram-empty")).toBeInTheDocument();
  });
});

describe("TenantComparison", () => {
  test("empty state with single slice", () => {
    render(<TenantComparison slices={[{ tenant: "a", errors: 1, total: 10 }]} />);
    expect(screen.getByTestId("tenant-comparison-empty")).toBeInTheDocument();
  });
});

describe("ErrorRateTimeSeries", () => {
  test("empty state without points", () => {
    render(<ErrorRateTimeSeries points={[]} />);
    expect(screen.getByTestId("error-rate-timeseries-empty")).toBeInTheDocument();
  });
});

describe("SLABreachAlert", () => {
  test("shows healthy banner when no breaches", () => {
    render(<SLABreachAlert breaches={[]} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/SLA dentro de objetivo/i)).toBeInTheDocument();
  });

  test("renders alerts for breaches", () => {
    render(
      <SLABreachAlert
        breaches={[
          { id: "1", name: "p95", severity: "critical", message: "slow", target_ms: 400, actual_ms: 800 },
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("p95")).toBeInTheDocument();
  });
});
