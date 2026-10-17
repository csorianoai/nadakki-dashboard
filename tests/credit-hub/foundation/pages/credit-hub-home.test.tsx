import { render, screen } from "@testing-library/react";
import CreditHubHome from "@/app/(forge)/credit-hub/page";

describe("CreditHubHome", () => {
  test("renders the 3 portals", () => {
    render(<CreditHubHome />);

    expect(screen.getByText("Portal concesionario")).toBeInTheDocument();
    expect(screen.getByText("Portal bancario")).toBeInTheDocument();
    expect(screen.getByText("Portal cliente")).toBeInTheDocument();
  });

  test('Dealer and Bank are interactive and only Customer shows "Próximamente"', () => {
    const { container } = render(<CreditHubHome />);

    expect(container.querySelectorAll('a[href="/credit-hub/dealer"]')).toHaveLength(1);
    expect(container.querySelectorAll('a[href="/credit-hub/bank"]')).toHaveLength(1);
    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
    expect(screen.getAllByText("Próximamente")).toHaveLength(1);
  });
});
