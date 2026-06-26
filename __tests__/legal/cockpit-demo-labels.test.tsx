/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

// ── A3: LegalKPIRow ──

jest.mock("@/lib/legal-cockpit/calendar-data", () => ({
  KPI_CARDS: [
    {
      label: "TEST KPI",
      value: 1,
      badge: "test",
      sub: "sub",
      accentColor: "0,0,0",
      sparkPoints: "0,0",
    },
  ],
  HEAT_BANDS: [],
  HEAT_ALPHA: [0],
  WEEK_DAYS: [],
  RAW_EVENTS: [],
  DEMO_REMINDERS: [],
  CIUDADES: ["Santo Domingo"],
  MONTH_EVENT_DOTS: {},
  EVENT_STYLES: {},
  HOUR_HEIGHT: 46,
  START_HOUR: 8,
  END_HOUR: 18,
}));

import { LegalKPIRow } from "@/components/legal-cockpit/LegalKPIRow";

describe("LegalKPIRow", () => {
  it("shows DEMO badge when demoData=true", () => {
    render(<LegalKPIRow demoData={true} />);
    expect(screen.getByText("DEMO")).toBeInTheDocument();
  });

  it("hides DEMO badge when demoData=false", () => {
    render(<LegalKPIRow demoData={false} />);
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
  });

  it("hides DEMO badge when demoData is omitted", () => {
    render(<LegalKPIRow />);
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
  });
});

// ── A5: PerformanceMetrics ──

import { PerformanceMetrics } from "@/components/legal-cockpit/PerformanceMetrics";

describe("PerformanceMetrics", () => {
  it("shows demo label", () => {
    render(<PerformanceMetrics />);
    expect(screen.getByText(/datos de ejemplo/)).toBeInTheDocument();
  });
});

// ── A6: LegalGoldenPath ──

import { LegalGoldenPath } from "@/components/legal-cockpit/LegalGoldenPath";

describe("LegalGoldenPath", () => {
  it("shows example flow subtitle", () => {
    render(
      <LegalGoldenPath
        steps={[{ step: 1, key: "a", label: "Step", status: "pending", action: "/x" }]}
        onStep={() => {}}
      />
    );
    expect(screen.getByText("Ejemplo de flujo")).toBeInTheDocument();
  });
});
