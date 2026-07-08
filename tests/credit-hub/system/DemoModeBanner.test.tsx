import { render, screen } from "@testing-library/react";
import { DemoModeBanner } from "@/components/forge/ui/DemoModeBanner";

describe("DemoModeBanner", () => {
  test("renders nothing when isDemo is false", () => {
    const { container } = render(<DemoModeBanner isDemo={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("credit-hub-demo-banner")).not.toBeInTheDocument();
  });

  test("renders nothing when isDemo is omitted via false prop", () => {
    render(<DemoModeBanner isDemo={false} />);
    expect(screen.queryByText(/MODO DEMO/i)).not.toBeInTheDocument();
  });

  test("renders persistent strip when isDemo is true", () => {
    render(<DemoModeBanner isDemo={true} />);
    const banner = screen.getByTestId("credit-hub-demo-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("role", "status");
    expect(screen.getByText(/MODO DEMO — Datos de demostración/i)).toBeInTheDocument();
  });
});
