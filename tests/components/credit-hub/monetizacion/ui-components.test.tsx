import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertChip,
  BpsStepper,
  KpiCard,
  MarginBadge,
  ModelCard,
} from "@/components/credit-hub/monetizacion/ui";

jest.mock("@/components/credit-hub/monetizacion/ui/components.css", () => ({}));

describe("Monetización UI components", () => {
  const wrap = (ui: React.ReactNode) => render(<div className="forge-monetizacion">{ui}</div>);
  test("AlertChip renders severity kind and text", () => {
    wrap(<AlertChip kind="TEST" text="Alert body" severity="warn" />);
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("Alert body")).toBeInTheDocument();
  });

  test("KpiCard fires onDrill on click", async () => {
    const onDrill = jest.fn();
    wrap(<KpiCard label="GMV" value="RD$ 1" onDrill={onDrill} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onDrill).toHaveBeenCalledTimes(1);
  });

  test("MarginBadge renders status class", () => {
    const { container } = wrap(<MarginBadge value="61%" status="ok" />);
    expect(container.querySelector(".fm-ui-margin-badge--ok")).toBeTruthy();
  });

  test("ModelCard toggles selection", async () => {
    const onSelect = jest.fn();
    wrap(
      <ModelCard code="B2" name="Híbrido" desc="desc" selected={false} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalled();
  });

  test("BpsStepper increments within bounds", async () => {
    const onChange = jest.fn();
    wrap(<BpsStepper value={30} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Aumentar bps"));
    expect(onChange).toHaveBeenCalledWith(35);
  });
});
