import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailConsentMethod } from "@/components/credit-hub/dealer/wizard/consent/EmailConsentMethod";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: jest.fn().mockResolvedValue({ token: "mock-email-token", status: "SENT" }),
    getStatus: jest.fn().mockResolvedValue({ status: "SENT", method: "EMAIL", accepted_at: null }),
  }),
}));

describe("EmailConsentMethod", () => {
  it("renders email input and disabled send initially", () => {
    render(<EmailConsentMethod applicationId="app-1" applicationReady />);
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("email-send")).toBeDisabled();
  });

  it("shows invalid email message", async () => {
    const user = userEvent.setup();
    render(<EmailConsentMethod applicationId="app-1" applicationReady />);
    await user.type(screen.getByTestId("email-input"), "no-arroba");
    expect(screen.getByText(/Correo electrónico inválido/i)).toBeInTheDocument();
  });

  it("shows poller after successful send", async () => {
    const user = userEvent.setup();
    render(<EmailConsentMethod applicationId="app-1" applicationReady />);
    await user.type(screen.getByTestId("email-input"), "cliente@ejemplo.com");
    await user.click(screen.getByTestId("email-send"));
    await waitFor(() => {
      expect(screen.getByTestId("consent-status-poller")).toBeInTheDocument();
      expect(screen.getByTestId("email-consent-link")).toHaveTextContent("Copiar");
      expect(screen.getByDisplayValue(`${window.location.origin}/consent/mock-email-token`)).toBeInTheDocument();
    });
  });
});
