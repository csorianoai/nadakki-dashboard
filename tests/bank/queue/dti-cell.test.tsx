/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { DtiCell, resolveDtiTone } from "@/app/(bank)/bank/applications/queue/components/DtiCell";
import { mockTenantThresholds } from "./test-utils";

describe("resolveDtiTone", () => {
  it("maps green band", () => {
    expect(resolveDtiTone(30, mockTenantThresholds())).toBe("green");
  });

  it("maps amber band", () => {
    expect(resolveDtiTone(40, mockTenantThresholds())).toBe("amber");
  });

  it("maps red band", () => {
    expect(resolveDtiTone(55, mockTenantThresholds())).toBe("red");
  });
});

describe("DtiCell", () => {
  it("renders numeric value", () => {
    render(<DtiCell value={33.3} thresholds={mockTenantThresholds()} />);
    expect(screen.getByTestId("dti-cell")).toHaveTextContent("33.3");
    expect(screen.getByTestId("dti-cell")).toHaveAttribute("data-tone", "green");
  });
});
