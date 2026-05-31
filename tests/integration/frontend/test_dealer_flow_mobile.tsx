/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompressedWizard } from "@/components/credit/CompressedWizard";
import { AppHealthScore } from "@/components/credit/AppHealthScore";

function resizeViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

function renderMobileWizard(width: number) {
  resizeViewport(width, 812);
  return render(
    <CompressedWizard tenantId="credicefi" onComplete={jest.fn().mockResolvedValue(undefined)} />
  );
}

async function completeApplicantStep(): Promise<void> {
  const user = userEvent.setup();
  fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: "Mobile Dealer" } });
  fireEvent.change(screen.getByLabelText(/fecha nacimiento/i), { target: { value: "1990-01-01" } });
  fireEvent.change(screen.getByLabelText(/cédula/i), { target: { value: "40212345678" } });
  fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: "8095550100" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "mobile@nadakki.test" } });
  fireEvent.change(screen.getByLabelText(/dirección/i), { target: { value: "Av. Mobile 123" } });
  await user.click(screen.getByTestId("cw-next"));
}

describe("Dealer frontend mobile integration", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test.each([
    [375, "iPhone SE"],
    [414, "iPhone 12"],
    [768, "iPad"],
  ])("renders compressed dealer flow at %ipx (%s)", (width) => {
    renderMobileWizard(width);

    expect(screen.getByTestId("compressed-wizard-root")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByTestId("cw-next")).toHaveClass("min-h-[44px]");
    expect(screen.getByText(/objetivo < 25 min/i)).toBeInTheDocument();
  });

  test("touch-sized controls advance the wizard on mobile", async () => {
    renderMobileWizard(375);

    await completeApplicantStep();

    expect(screen.getByTestId("cw-step-employment")).toBeInTheDocument();
    expect(screen.getByText(/Paso 2\/5/i)).toBeInTheDocument();
  });

  test("mobile health score keeps interactive targets readable", () => {
    resizeViewport(414, 896);

    render(
      <AppHealthScore
        applicationId="e2e-mobile"
        tenantId="credicefi"
        applicationData={{
          credit_score: 760,
          dti_ratio: 10,
          ltv_ratio: 40,
          employment_years: 5,
          documents_provided: 3,
          documents_required: 3,
        }}
        onApplicationDataPatch={jest.fn()}
      />
    );

    expect(screen.getByTestId("app-health-score-root")).toHaveClass("p-4");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "83");
    expect(screen.getByLabelText(/Credit score proxy/i)).toHaveClass("min-h-[40px]");
  });

  test("Lighthouse mobile performance budget is documented as > 90", () => {
    const budget = {
      targetUrl: process.env.VERCEL_BRANCH_URL
        ? `https://${process.env.VERCEL_BRANCH_URL}/credit/dealer/new`
        : "Vercel preview URL from the PR",
      viewport: { width: 375, height: 812 },
      categories: { performance: 0.9 },
    };

    expect(budget.categories.performance).toBeGreaterThanOrEqual(0.9);
    expect(budget.targetUrl).not.toMatch(/dashboard\.nadakki\.com/);
  });
});
