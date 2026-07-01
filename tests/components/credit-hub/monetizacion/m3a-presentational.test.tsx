import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertChip, KpiCard, MarginBadge, RevenueBar } from "@/components/credit-hub/monetizacion/ui";

jest.mock("@/components/credit-hub/monetizacion/ui/components-presentational.css", () => ({}));

describe("Monetización M3a presentational UI", () => {
  const wrap = (ui: React.ReactNode) => render(<div className="forge-monetizacion">{ui}</div>);

  test("AlertChip renders", () => {
    wrap(<AlertChip kind="TEST" text="Alert body" severity="warn" />);
    expect(screen.getByText("TEST")).toBeInTheDocument();
  });

  test("KpiCard onDrill", async () => {
    const onDrill = jest.fn();
    wrap(<KpiCard label="GMV" value="RD$ 1" onDrill={onDrill} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "GMV, RD$ 1. Ver origen de la cifra",
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onDrill).toHaveBeenCalled();
  });

  test("RevenueBar renders pct", () => {
    wrap(<RevenueBar label="Comisión" amount="RD$ 100" pct={41} color="green" />);
    expect(screen.getByText(/41%/)).toBeInTheDocument();
  });

  test("MarginBadge status", () => {
    const { container } = wrap(<MarginBadge value="61%" status="ok" />);
    expect(container.querySelector(".fm-ui-margin-badge--ok")).toBeTruthy();
  });
});
