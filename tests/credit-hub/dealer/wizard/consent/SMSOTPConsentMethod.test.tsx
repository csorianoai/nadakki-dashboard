import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SMSOTPConsentMethod } from "@/components/credit-hub/dealer/wizard/consent/SMSOTPConsentMethod";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: jest.fn().mockResolvedValue({ status: "SENT" }),
  }),
}));

describe("SMSOTPConsentMethod", () => {
  it("disables send until valid phone", () => {
    render(
      <SMSOTPConsentMethod
        applicationId="app-1"
        applicationReady
        dealerOtpCode=""
        onDealerOtpCodeChange={jest.fn()}
      />
    );
    expect(screen.getByTestId("sms-send-otp")).toBeDisabled();
  });

  it("shows OTP fields after send", async () => {
    const user = userEvent.setup();
    render(
      <SMSOTPConsentMethod
        applicationId="app-1"
        applicationReady
        dealerOtpCode=""
        onDealerOtpCodeChange={jest.fn()}
      />
    );
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-dealer-otp-input")).toBeInTheDocument();
    });
  });
});
