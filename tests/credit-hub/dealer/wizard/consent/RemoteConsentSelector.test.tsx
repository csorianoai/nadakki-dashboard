import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemoteConsentSelector } from "@/components/credit-hub/dealer/wizard/consent/RemoteConsentSelector";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: jest.fn().mockResolvedValue({ token: "mock-token", status: "SENT" }),
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
        onSmsVerifyStub={noop}
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
        onSmsVerifyStub={noop}
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
        onSmsVerifyStub={noop}
      />
    );
    await user.click(screen.getByTestId("method-whatsapp"));
    expect(screen.getByTestId("whatsapp-method")).toBeInTheDocument();
  });
});
