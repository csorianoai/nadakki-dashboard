import { render, screen } from "@testing-library/react";
import { StepConsent } from "@/components/credit-hub/dealer/wizard/StepConsent";

jest.mock("@/components/forge/credit-hub/dealer/DealerWizardConsentStep", () => ({
  DealerWizardConsentStep: () => <div data-testid="step-consent">Consent step</div>,
}));

describe("StepConsent", () => {
  test("renders consent step", () => {
    render(<StepConsent />);
    expect(screen.getByTestId("step-consent")).toBeInTheDocument();
  });
});
