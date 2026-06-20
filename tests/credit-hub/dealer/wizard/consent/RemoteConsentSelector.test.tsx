import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemoteConsentSelector } from "@/components/credit-hub/dealer/wizard/consent/RemoteConsentSelector";
import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: jest.fn().mockResolvedValue({ token: "mock-token", status: "SENT" }),
    accept: jest.fn().mockResolvedValue({ accepted_at: "2026-06-19T12:00:00Z", audit_hash: "hash" }),
    getStatus: jest.fn().mockResolvedValue({ status: "SENT", method: "WHATSAPP", accepted_at: null }),
  }),
}));

const noop = () => {};

describe("RemoteConsentSelector", () => {
  it("renders only enabled methods", () => {
    render(
      <RemoteConsentSelector
        applicationId="app-1"
        applicationReady
        enabledMethods={["WHATSAPP", "EMAIL"]}
        dealerOtpCode=""
        onDealerOtpCodeChange={noop}
        onSmsOtpSent={noop}
        consentsAccepted={["terms_accepted"]}
        fullName="Test User"
        onFullNameChange={noop}
      />
    );
    expect(screen.getByTestId("method-whatsapp")).toBeInTheDocument();
    expect(screen.getByTestId("method-email")).toBeInTheDocument();
    expect(screen.queryByTestId("method-sms_otp")).not.toBeInTheDocument();
    expect(screen.queryByTestId("method-selfie")).not.toBeInTheDocument();
  });

  it("renders all 4 methods when all enabled", () => {
    render(
      <RemoteConsentSelector
        applicationId="app-1"
        applicationReady
        enabledMethods={["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"]}
        dealerOtpCode=""
        onDealerOtpCodeChange={noop}
        onSmsOtpSent={noop}
        consentsAccepted={["terms_accepted"]}
        fullName="Test User"
        onFullNameChange={noop}
      />
    );
    expect(screen.getByTestId("method-whatsapp")).toBeInTheDocument();
    expect(screen.getByTestId("method-email")).toBeInTheDocument();
    expect(screen.getByTestId("method-sms_otp")).toBeInTheDocument();
    expect(screen.getByTestId("method-selfie")).toBeInTheDocument();
  });

  it("shows method-specific component on selection", async () => {
    const user = userEvent.setup();
    render(
      <RemoteConsentSelector
        applicationId="app-1"
        applicationReady
        enabledMethods={["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"]}
        dealerOtpCode=""
        onDealerOtpCodeChange={noop}
        onSmsOtpSent={noop}
        consentsAccepted={["terms_accepted"]}
        fullName="Test User"
        onFullNameChange={noop}
      />
    );
    await user.click(screen.getByTestId("method-whatsapp"));
    expect(screen.getByTestId("whatsapp-method")).toBeInTheDocument();
  });
});
