import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WhatsAppConsentMethod } from "@/components/credit-hub/dealer/wizard/consent/WhatsAppConsentMethod";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: jest.fn().mockResolvedValue({ token: "mock-token-xyz", status: "SENT" }),
    getStatus: jest.fn().mockResolvedValue({ status: "SENT", method: "WHATSAPP", accepted_at: null }),
  }),
}));

describe("WhatsAppConsentMethod", () => {
  it("renders phone input and disabled send button initially", () => {
    render(<WhatsAppConsentMethod applicationId="app-1" applicationReady />);
    expect(screen.getByTestId("whatsapp-phone-input")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-send")).toBeDisabled();
  });

  it("validates phone format", async () => {
    const user = userEvent.setup();
    render(<WhatsAppConsentMethod applicationId="app-1" applicationReady />);
    const input = screen.getByTestId("whatsapp-phone-input");
    await user.type(input, "abc");
    expect(screen.getByText(/Teléfono inválido/i)).toBeInTheDocument();
  });

  it("enables send button on valid phone", async () => {
    const user = userEvent.setup();
    render(<WhatsAppConsentMethod applicationId="app-1" applicationReady />);
    const input = screen.getByTestId("whatsapp-phone-input");
    await user.type(input, "+1-809-555-1234");
    expect(screen.getByTestId("whatsapp-send")).not.toBeDisabled();
  });

  it("shows status poller after successful send", async () => {
    const user = userEvent.setup();
    render(<WhatsAppConsentMethod applicationId="app-1" applicationReady />);
    await user.type(screen.getByTestId("whatsapp-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("whatsapp-send"));
    await waitFor(() => {
      expect(screen.getByTestId("consent-status-poller")).toBeInTheDocument();
    });
  });
});
