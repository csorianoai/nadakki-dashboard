import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { UsageWidget } from "@/app/competitor-research/components/UsageWidget";

describe("UsageWidget", () => {
  it("shows placeholder when usage null", () => {
    render(<UsageWidget usage={null} lang="en" />);
    expect(screen.getByText("…")).toBeInTheDocument();
  });
  it("renders rows and cost", () => {
    render(
      <UsageWidget
        usage={{
          rows_used: 10,
          rows_cap: 100,
          percent_used: 10,
          cost_estimate_usd: 1.5,
          cache_hit_rate_pct: 25,
        }}
        lang="en"
      />
    );
    expect(screen.getByText(/10 \/ 100 rows/)).toBeInTheDocument();
    expect(screen.getByText(/\$1\.50/)).toBeInTheDocument();
  });
});
