import { render, screen } from "@testing-library/react";
import { ChSidebar } from "@/components/credit-hub/shell/ChSidebar";

describe("ChSidebar", () => {
  test("renders bank navigation labels", () => {
    render(
      <div className="credit-hub-forge" data-persona="bank">
        <ChSidebar persona="bank" activePath="/credit-hub/bank/applications" institutionName="Test Bank" />
      </div>
    );
    expect(screen.getByRole("complementary", { name: /Portal bancario navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bandeja/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Analítica/i })).toBeInTheDocument();
  });

  test("renders dealer navigation labels", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <ChSidebar persona="dealer" activePath="/credit-hub/dealer" institutionName="Test Dealer" />
      </div>
    );
    expect(screen.getByRole("complementary", { name: /Portal dealer navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Simulador/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva/i })).toBeInTheDocument();
  });
});
