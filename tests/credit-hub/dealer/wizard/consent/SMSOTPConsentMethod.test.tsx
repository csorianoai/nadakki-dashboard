import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SMSOTPConsentMethod } from "@/components/credit-hub/dealer/wizard/consent/SMSOTPConsentMethod";
import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

const mockInitiate = jest.fn();
const mockAccept = jest.fn();

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: mockInitiate,
    accept: mockAccept,
  }),
}));

const baseProps = {
  applicationId: "app-1",
  applicationReady: true,
  dealerOtpCode: "",
  onDealerOtpCodeChange: jest.fn(),
  onComplete: jest.fn(),
  consentsAccepted: ["bureau_authorization", "terms_accepted", "data_processing_authorization"],
  fullName: "Juan Pérez",
  onFullNameChange: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInitiate.mockResolvedValue({ token: "tok-abc", status: "SENT" });
  mockAccept.mockResolvedValue({ accepted_at: "2026-06-19T12:00:00Z", audit_hash: "abc123" });
});

describe("SMSOTPConsentMethod", () => {
  it("disables send until valid phone", () => {
    render(<SMSOTPConsentMethod {...baseProps} />);
    expect(screen.getByTestId("sms-send-otp")).toBeDisabled();
  });

  it("shows OTP fields after send", async () => {
    const user = userEvent.setup();
    render(<SMSOTPConsentMethod {...baseProps} />);
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-dealer-otp-input")).toBeInTheDocument();
    });
  });

  it("saves token from initiate and shows verify button", async () => {
    const user = userEvent.setup();
    render(<SMSOTPConsentMethod {...baseProps} />);
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(mockInitiate).toHaveBeenCalledWith("app-1", "SMS_OTP", { phone: "+1-809-555-1234" });
    });
    expect(screen.getByTestId("sms-verify-otp")).toBeInTheDocument();
  });

  it("calls accept on verify and fires onComplete with audit hash", async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SMSOTPConsentMethod {...baseProps} dealerOtpCode="123456" onComplete={onComplete} />
    );
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-verify-otp")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("sms-verify-otp"));
    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledWith("tok-abc", {
        otp_code: "123456",
        consents_accepted: ["bureau_authorization", "terms_accepted", "data_processing_authorization"],
        full_name: "Juan Pérez",
      });
    });
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({ method: "SMS_OTP", auditHash: "abc123" });
    });
  });

  it("shows error on invalid OTP without calling onComplete", async () => {
    mockAccept.mockRejectedValue(new Error("Invalid OTP"));
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <SMSOTPConsentMethod {...baseProps} dealerOtpCode="999999" onComplete={onComplete} />
    );
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-verify-otp")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("sms-verify-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-verify-error")).toBeInTheDocument();
      expect(screen.getByTestId("sms-verify-error")).toHaveTextContent("Invalid OTP");
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows error on expired OTP and allows resend", async () => {
    mockAccept.mockRejectedValue(new Error("No pending OTP found or expired"));
    const user = userEvent.setup();
    render(
      <SMSOTPConsentMethod {...baseProps} dealerOtpCode="123456" />
    );
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-verify-otp")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("sms-verify-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-verify-error")).toHaveTextContent("No pending OTP found or expired");
    });
    expect(screen.getByTestId("sms-resend-otp")).toBeInTheDocument();
  });

  it("disables verify when fullName is empty", async () => {
    const user = userEvent.setup();
    render(
      <SMSOTPConsentMethod {...baseProps} fullName="" dealerOtpCode="123456" />
    );
    await user.type(screen.getByTestId("sms-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("sms-send-otp"));
    await waitFor(() => {
      expect(screen.getByTestId("sms-verify-otp")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sms-verify-otp")).toBeDisabled();
  });

  it("does not reference any stub in its source", () => {
    const source = SMSOTPConsentMethod.toString();
    expect(source).not.toContain("Stub");
    expect(source).not.toContain("stub");
  });
});
