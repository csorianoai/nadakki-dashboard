import { render, screen } from "@testing-library/react";
import { PreApprovalView } from "@/components/credit-hub/dealer/preapproval/PreApprovalView";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/credit-hub/dealer/preapproval/PreApprovalSimulator", () => ({
  PreApprovalSimulator: () => <div data-testid="preapproval-simulator">Simulator</div>,
}));

describe("PreApprovalView", () => {
  test("renders simulator heading", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <PreApprovalView locale="es-DO" currency="DOP" />
      </div>,
    );
    expect(screen.getByRole("heading", { name: /Simulador de preaprobación/i })).toBeInTheDocument();
    expect(screen.getByTestId("preapproval-simulator")).toBeInTheDocument();
  });
});
