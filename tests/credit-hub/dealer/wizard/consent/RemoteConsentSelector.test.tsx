import { render, screen, within } from "@testing-library/react";
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
    initiate: (...args: unknown[]) => mockInitiate(...args),
    accept: jest.fn().mockResolvedValue({ accepted_at: "2026-06-19T12:00:00Z", audit_hash: "hash" }),
    getStatus: jest.fn().mockResolvedValue({ status: "SENT", method: "WHATSAPP", accepted_at: null }),
  }),
}));

const mockInitiate = jest.fn();
const noop = () => {};

describe("RemoteConsentSelector", () => {
  beforeEach(() => mockInitiate.mockReset().mockResolvedValue({ token: "mock-token", status: "SENT" }));

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

  it("Email está deshabilitado (staging sin proveedor real, DB-CODEX-16 paso 4) y no abre su formulario", async () => {
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
    expect(within(screen.getByTestId("method-email")).getByRole("radio")).toBeDisabled();
    expect(screen.getByTestId("method-email-unavailable")).toHaveTextContent(/canal no disponible/i);
    await user.click(screen.getByTestId("method-email"));
    expect(screen.queryByTestId("email-method")).not.toBeInTheDocument();
  });

  it("WhatsApp, SMS_OTP y Selfie están deshabilitados con su razón y no se pueden iniciar", async () => {
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
    for (const k of ["whatsapp", "sms_otp", "selfie"]) {
      expect(within(screen.getByTestId(`method-${k}`)).getByRole("radio")).toBeDisabled();
      expect(screen.getByTestId(`method-${k}-unavailable`)).toHaveTextContent(/canal no disponible/i);
      await user.click(screen.getByTestId(`method-${k}`));
    }
    expect(screen.queryByTestId("whatsapp-method")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sms-otp-method")).not.toBeInTheDocument();
    expect(screen.queryByTestId("selfie-method")).not.toBeInTheDocument();
    expect(mockInitiate).not.toHaveBeenCalled();
  });

  it("la razón de los canales deshabilitados no ofrece el correo (también está deshabilitado)", () => {
    render(
      <RemoteConsentSelector
        applicationId="app-1"
        applicationReady
        enabledMethods={["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"]}
        dealerOtpCode=""
        onDealerOtpCodeChange={noop}
        onSmsOtpSent={noop}
        consentsAccepted={["LEY_172_13"]}
        fullName="Test User"
        onFullNameChange={noop}
      />
    );
    for (const k of ["whatsapp", "email", "sms_otp", "selfie"]) {
      expect(screen.getByTestId(`method-${k}-unavailable`)).not.toHaveTextContent(/correo/i);
    }
  });
});
