import { render, screen } from "@testing-library/react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import {
  COCKPIT_DATA_SOURCE_TO_BADGE,
  cockpitDataSourceToBadgeLevel,
} from "@/lib/cockpit/finance-v3/data-source";
import { DATA_TRUTH_LABELS } from "@/lib/credit-hub/honesty/data-truth";

describe("Cockpit data_source → DataTruthBadge mapping", () => {
  const cases = [
    ["live", "REAL", "Real"],
    ["derived", "DERIVED", "Derivado"],
    ["estimated", "ESTIMATED", "est."],
    ["demo", "DEMO", "Demo"],
    ["none", "NONE", "sin data"],
  ] as const;

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
});
