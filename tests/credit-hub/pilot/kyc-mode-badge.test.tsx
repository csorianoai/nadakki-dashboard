import { render, screen } from "@testing-library/react";
import { KycModeBadge } from "@/components/credit-hub/labels/KycModeBadge";

describe("KycModeBadge", () => {
  it("mock backend value shows DATOS SIMULADOS, not LIVE", () => {
    render(<KycModeBadge value="mock" />);
    expect(screen.getByTestId("kyc-mode-badge")).toHaveTextContent("DATOS SIMULADOS");
    expect(screen.getByTestId("kyc-mode-badge")).not.toHaveTextContent("PROVEEDOR EN VIVO");
  });

  it("null shows Not Set", () => {
    render(<KycModeBadge value={null} />);
    expect(screen.getByTestId("kyc-mode-badge")).toHaveTextContent("Not Set");
  });
});
