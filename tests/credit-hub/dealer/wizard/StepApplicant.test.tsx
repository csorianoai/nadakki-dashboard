import { render, screen } from "@testing-library/react";
import { StepApplicant } from "@/components/credit-hub/dealer/wizard/StepApplicant";

jest.mock("@/components/forge/credit-hub/dealer/DealerWizardApplicantEmploymentStep", () => ({
  DealerWizardApplicantEmploymentStep: () => <div data-testid="step-applicant">Applicant step</div>,
}));

describe("StepApplicant", () => {
  test("renders applicant step", () => {
    render(<StepApplicant />);
    expect(screen.getByTestId("step-applicant")).toBeInTheDocument();
  });
});
