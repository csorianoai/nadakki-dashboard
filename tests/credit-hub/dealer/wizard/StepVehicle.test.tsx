import { render, screen } from "@testing-library/react";
import { StepVehicle } from "@/components/credit-hub/dealer/wizard/StepVehicle";

jest.mock("@/components/forge/credit-hub/dealer/DealerWizardVehicleFinancialStep", () => ({
  DealerWizardVehicleFinancialStep: () => <div data-testid="step-vehicle">Vehicle step</div>,
}));

describe("StepVehicle", () => {
  test("renders vehicle step", () => {
    render(<StepVehicle />);
    expect(screen.getByTestId("step-vehicle")).toBeInTheDocument();
  });
});
