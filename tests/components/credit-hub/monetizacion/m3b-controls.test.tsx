import { render, screen } from "@testing-library/react";
import { WhatIfPanel } from "@/components/credit-hub/monetizacion/ui";

jest.mock("@/components/credit-hub/monetizacion/ui/components-controls.css", () => ({}));

describe("Monetización M3b WhatIfPanel", () => {
  test("live config computes B2 anchor total", () => {
    render(
      <div className="forge-monetizacion">
        <WhatIfPanel config={{ base: "B2", bps: 30, addAI: true, addSeats: true, addSetup: false }} />
      </div>,
    );
    expect(screen.getByText("RD$ 462,442.00")).toBeInTheDocument();
    expect(screen.getByText(/\+RD\$ 0\.00/)).toBeInTheDocument();
  });

  test("empty base shows section 8 copy", () => {
    render(
      <div className="forge-monetizacion">
        <WhatIfPanel config={null} />
      </div>,
    );
    expect(screen.getByText(/Elige un modelo base/)).toBeInTheDocument();
  });
});
