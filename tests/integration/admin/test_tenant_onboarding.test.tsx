/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingProvider } from "@/components/admin/onboarding/OnboardingProvider";
import { BasicInfoStep } from "@/components/admin/onboarding/steps/BasicInfoStep";
import { CoresStep } from "@/components/admin/onboarding/steps/CoresStep";
import { UsersStep } from "@/components/admin/onboarding/steps/UsersStep";
import { ReviewStep } from "@/components/admin/onboarding/steps/ReviewStep";
import {
  EMPTY_ONBOARDING_STATE,
  estimateMonthlyUsd,
  getNextStep,
  getPrevStep,
  hasCreditCoreSelected,
  validateOnboardingStep,
} from "@/hooks/useTenantOnboarding";
import type { TenantOnboardingState } from "@/types/onboarding";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  notFound: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    message: jest.fn(),
  },
}));

jest.mock("@/lib/admin/onboarding-api", () => ({
  postOnboardingDraft: jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    data: { tenant_id: "e2e-tenant-prov" },
  }),
  postOnboardingActivate: jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    data: { tenant_id: "e2e-activated", provisional_access_until: "2099-01-01T00:00:00Z" },
  }),
  postUploadTenantLogo: jest.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  postTenantBankCredentialSecrets: jest.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  postInviteTenantUsers: jest.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
}));

describe("tenant onboarding helpers", () => {
  test("getNextStep skips bank step when credit core off", () => {
    expect(getNextStep(4, false)).toBe(6);
    expect(getNextStep(4, true)).toBe(5);
  });

  test("getPrevStep goes to 4 from review when credit off", () => {
    expect(getPrevStep(6, false)).toBe(4);
    expect(getPrevStep(6, true)).toBe(5);
  });

  test("estimateMonthlyUsd sums tiers", () => {
    const s: TenantOnboardingState = {
      ...EMPTY_ONBOARDING_STATE,
      step3: {
        cores: [
          { core: "marketing", tier: "starter" },
          { core: "credit", tier: "pro" },
        ],
      },
    };
    expect(estimateMonthlyUsd(s)).toBe(79 + 249);
  });

  test("validateOnboardingStep catches empty slug", () => {
    const err = validateOnboardingStep(1, EMPTY_ONBOARDING_STATE);
    expect(err.slug).toBeDefined();
    expect(err.contactEmail).toBeDefined();
  });

  test("hasCreditCoreSelected detects credit", () => {
    expect(hasCreditCoreSelected(EMPTY_ONBOARDING_STATE)).toBe(true);
    const noCredit: TenantOnboardingState = {
      ...EMPTY_ONBOARDING_STATE,
      step3: { cores: [{ core: "marketing", tier: "starter" }] },
    };
    expect(hasCreditCoreSelected(noCredit)).toBe(false);
  });
});

describe("tenant onboarding steps (RTL)", () => {
  test("BasicInfoStep renders slug and contact fields", () => {
    render(
      <OnboardingProvider>
        <BasicInfoStep />
      </OnboardingProvider>,
    );
    expect(screen.getByTestId("onboarding-slug")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-contact-email")).toBeInTheDocument();
  });

  test("CoresStep toggles credit checkbox", async () => {
    const user = userEvent.setup();
    render(
      <OnboardingProvider>
        <CoresStep />
      </OnboardingProvider>,
    );
    const credit = screen.getByTestId("onboarding-core-credit");
    expect(credit).toBeChecked();
    await user.click(credit);
    expect(credit).not.toBeChecked();
  });

  test("UsersStep adds up to extra users", async () => {
    const user = userEvent.setup();
    render(
      <OnboardingProvider>
        <UsersStep />
      </OnboardingProvider>,
    );
    const btn = screen.getByTestId("onboarding-add-user");
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    expect(screen.getAllByTestId(/onboarding-extra-user-/)).toHaveLength(3);
    expect(btn).toBeDisabled();
  });

  test("ReviewStep shows estimate from context", () => {
    render(
      <OnboardingProvider>
        <ReviewStep />
      </OnboardingProvider>,
    );
    expect(screen.getByTestId("onboarding-estimate")).toHaveTextContent("USD");
  });

  test("BasicInfoStep fills slug via user input", async () => {
    const user = userEvent.setup();
    render(
      <OnboardingProvider>
        <BasicInfoStep />
      </OnboardingProvider>,
    );
    const slug = screen.getByTestId("onboarding-slug");
    await user.clear(slug);
    await user.type(slug, "acme-org");
    expect(slug).toHaveValue("acme-org");
  });

  test("ReviewStep opens confirmation dialog", async () => {
    const user = userEvent.setup();
    render(
      <OnboardingProvider>
        <ReviewStep />
      </OnboardingProvider>,
    );
    await user.click(screen.getByTestId("onboarding-open-activate"));
    expect(await screen.findByTestId("onboarding-confirm-dialog")).toBeVisible();
  });
});
