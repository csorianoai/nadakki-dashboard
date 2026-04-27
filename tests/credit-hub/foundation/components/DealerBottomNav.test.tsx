import { render, screen } from "@testing-library/react";
import { DealerBottomNav } from "@/components/credit-hub/navigation/DealerBottomNav";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer/applications",
}));

describe("DealerBottomNav", () => {
  test("highlights active route", () => {
    render(<DealerBottomNav />);
    expect(screen.getByRole("link", { name: /Solicitudes/ })).toHaveAttribute("aria-current", "page");
  });

  test("primary action Plus is visually distinct", () => {
    render(<DealerBottomNav />);
    const primaryAction = screen.getByRole("link", { name: /Nueva/ });
    expect(primaryAction.querySelector(".from-forge-primary")).toBeInTheDocument();
  });
});
