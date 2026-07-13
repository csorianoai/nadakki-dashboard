import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import {
  COCKPIT_DATA_SOURCE_TO_BADGE,
  cockpitDataSourceToBadgeLevel,
} from "@/lib/cockpit/finance-v3/data-source";
import { cockpitDataSourceSchema } from "@/lib/cockpit/finance-v3/envelope";
import { DATA_TRUTH_LABELS } from "@/lib/credit-hub/honesty/data-truth";

describe("Cockpit data_source → DataTruthBadge mapping (7 states)", () => {
  const cases = [
    ["live", "REAL", "Real"],
    ["derived", "DERIVED", "Derivado"],
    ["partial", "PARTIAL", "parcial"],
    ["demo", "DEMO", "Demo"],
    ["none", "NONE", "sin data"],
    ["stale", "STALE", "obsoleto"],
    ["error", "ERROR", "error"],
  ] as const;

  test("schema defines exactly 7 states without estimated", () => {
    expect(cockpitDataSourceSchema.options).toEqual([
      "live",
      "derived",
      "partial",
      "demo",
      "none",
      "stale",
      "error",
    ]);
    expect(cockpitDataSourceSchema.options).not.toContain("estimated");
  });

  test.each(cases)("maps %s to badge level %s", (source, level, label) => {
    expect(cockpitDataSourceToBadgeLevel(source)).toBe(level);
    expect(COCKPIT_DATA_SOURCE_TO_BADGE[source]).toBe(level);
    expect(DATA_TRUTH_LABELS[level]).toBe(label);
  });

  test.each(cases)("renders badge for data_source %s", (source, _level, label) => {
    const level = cockpitDataSourceToBadgeLevel(source);
    render(<DataTruthBadge level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label)).toHaveAttribute("data-truth", level);
  });

  test("ERROR badge renders retry action when onRetry provided", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(<DataTruthBadge level="ERROR" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
