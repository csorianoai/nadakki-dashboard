import { render, screen } from "@testing-library/react";
import CreditHubHome from "@/app/(forge)/credit-hub/page";

describe("CreditHubHome", () => {
  test("renders all 4 portals", () => {
    render(<CreditHubHome />);

    expect(screen.getByText("Portal concesionario")).toBeInTheDocument();
    expect(screen.getByText("Portal bancario")).toBeInTheDocument();
    expect(screen.getByText("Portal cliente")).toBeInTheDocument();
    expect(screen.getByText("Administración")).toBeInTheDocument();
  });

  test('only Dealer is interactive and others show "Próximamente"', () => {
    const { container } = render(<CreditHubHome />);

    expect(container.querySelectorAll('a[href="/credit-hub/dealer"]')).toHaveLength(1);
    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
    expect(screen.getAllByText("Próximamente")).toHaveLength(3);
  });
});
