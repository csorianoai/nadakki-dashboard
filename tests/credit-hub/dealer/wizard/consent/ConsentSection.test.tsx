import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentSection, type ConsentWizardPatch } from "@/components/credit-hub/dealer/wizard/consent/ConsentSection";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => {
  const actual = jest.requireActual<typeof import("@/lib/credit-hub/hooks/useTenantConfig")>(
    "@/lib/credit-hub/hooks/useTenantConfig"
  );
  return {
    ...actual,
    useTenantConfig: jest.fn(() => ({
      tenantConfig: {
        ...actual.getDefaultTenantBankingConfig("consent-test-tenant"),
        consent_methods_enabled: ["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"],
      },
      loading: false,
    })),
  };
});

const mockUseTenantConfig = useTenantConfig as unknown as jest.Mock;

const baseFields = {
  applicationId: "app-1",
  applicationIdReady: true,
  consent_bureau_authorization: false,
  consent_terms_accepted: false,
  consent_data_processing_authorization: false,
  consent_signature_full_name: "",
  consent_present_confirmed: false,
  consent_method: "",
  consent_audit_hash: "",
  consent_accepted_at: "",
  consent_sms_otp_sent: false,
  consent_dealer_otp_code: "",
};

function ConsentSectionHarness({ initialPresence }: { initialPresence: "present" | "remote" }) {
  const [form, setForm] = useState({
    ...baseFields,
    consent_presence: initialPresence,
  });
  const onPatch = (patch: ConsentWizardPatch) => setForm((prev) => ({ ...prev, ...patch }));
  return <ConsentSection {...form} onPatch={onPatch} />;
}

describe("ConsentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTenantConfig.mockReturnValue({
      tenantConfig: {
        ...jest.requireActual<typeof import("@/lib/credit-hub/hooks/useTenantConfig")>(
          "@/lib/credit-hub/hooks/useTenantConfig"
        ).getDefaultTenantBankingConfig("consent-test-tenant"),
        consent_methods_enabled: ["WHATSAPP", "EMAIL", "SMS_OTP", "SELFIE"],
      },
      loading: false,
    });
  });

  it("renders presence question", () => {
    render(<ConsentSectionHarness initialPresence="present" />);
    expect(screen.getByTestId("consent-section")).toBeInTheDocument();
    expect(screen.getByText(/físicamente presente/i)).toBeInTheDocument();
  });

  it("shows present form when 'aquí' is selected", async () => {
    const user = userEvent.setup();
    render(<ConsentSectionHarness initialPresence="remote" />);
    await user.click(screen.getByLabelText(/Sí, está aquí/i));
    expect(screen.getByTestId("present-consent-form")).toBeInTheDocument();
  });

  it("shows remote selector when 'remoto' is selected", async () => {
    const user = userEvent.setup();
    render(<ConsentSectionHarness initialPresence="present" />);
    await user.click(screen.getByLabelText(/No, está remoto/i));
    expect(screen.getByTestId("remote-consent-selector")).toBeInTheDocument();
  });
});
