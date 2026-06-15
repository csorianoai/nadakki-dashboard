import { render, screen } from "@testing-library/react";
import { ChSidebar } from "@/components/credit-hub/shell/ChSidebar";

describe("ChSidebar", () => {
  test("renders bank navigation labels", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <ChSidebar persona="bank" active="bandeja" institutionName="TestBank Mexico" />
      </div>
    );
    expect(screen.getByRole("navigation", { name: /Bank navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bandeja/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Analítica/i })).toBeInTheDocument();
  });

  test("renders dealer navigation labels", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <ChSidebar persona="dealer" active="nueva" institutionName="Auto Plaza" />
      </div>
    );
    expect(screen.getByRole("navigation", { name: /Dealer navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Preaprobación/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nueva/i })).toBeInTheDocument();
  });
});
