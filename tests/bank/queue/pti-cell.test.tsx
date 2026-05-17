/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { PtiCell, resolvePtiTone } from "@/app/(bank)/bank/applications/queue/components/PtiCell";
import { mockTenantThresholds } from "./test-utils";

describe("resolvePtiTone", () => {
  it("green within tenant cap", () => {
    expect(resolvePtiTone(12, mockTenantThresholds())).toBe("green");
  });

  it("amber within middle band", () => {
    expect(resolvePtiTone(18, mockTenantThresholds())).toBe("amber");
  });

  it("red above amber max", () => {
    expect(resolvePtiTone(25, mockTenantThresholds())).toBe("red");
  });
});

describe("PtiCell", () => {
  it("renders percentage label", () => {
    render(<PtiCell value={16} thresholds={mockTenantThresholds()} />);
    expect(screen.getByTestId("pti-cell")).toHaveTextContent("16%");
    expect(screen.getByTestId("pti-cell")).toHaveAttribute("data-tone", "amber");
  });
});
