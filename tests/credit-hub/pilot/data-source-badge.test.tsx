import { render, screen } from "@testing-library/react";
import { CreditDataSourceBadge } from "@/components/credit-hub/labels/CreditDataSourceBadge";

describe("CreditDataSourceBadge", () => {
  it.each([
    ["DEMO", "DEMO"],
    ["MOCK", "DATOS SIMULADOS"],
    ["MANUAL_REVIEW", "REVISIÓN MANUAL"],
    ["LIVE", "PROVEEDOR EN VIVO"],
  ] as const)("renders backend label %s as %s", (input, expected) => {
    render(<CreditDataSourceBadge value={input} />);
    expect(screen.getByTestId("credit-data-source-badge")).toHaveTextContent(expected);
    expect(screen.getByTestId("credit-data-source-badge")).toHaveAttribute("data-source-label", input);
  });

  it("null shows Estado desconocido, never LIVE", () => {
    render(<CreditDataSourceBadge value={null} />);
    const el = screen.getByTestId("credit-data-source-badge");
    expect(el).toHaveTextContent("Estado desconocido");
    expect(el).not.toHaveTextContent("PROVEEDOR EN VIVO");
    expect(el).toHaveAttribute("data-source-label", "null");
  });
});
