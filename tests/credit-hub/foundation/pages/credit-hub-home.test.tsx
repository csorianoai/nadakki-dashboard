import { render, screen } from "@testing-library/react";
import CreditHubHome from "@/app/credit-hub/page";

describe("CreditHubHome", () => {
  test("renders all 4 portals", () => {
    render(<CreditHubHome />);

    expect(screen.getByText("Dealer Portal")).toBeInTheDocument();
    expect(screen.getByText("Bank Portal")).toBeInTheDocument();
    expect(screen.getByText("Customer Portal")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test('only Dealer is interactive and others show "Próximamente"', () => {
    const { container } = render(<CreditHubHome />);

    expect(container.querySelectorAll('a[href="/credit-hub/dealer"]')).toHaveLength(1);
    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
    expect(screen.getAllByText("Próximamente")).toHaveLength(3);
  });
});
