import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { ConsentChannelUnavailableError } from "@/lib/credit-hub/api/consent-client";
import { EmailConsentMethod } from "@/components/credit-hub/dealer/wizard/consent/EmailConsentMethod";

import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

const mockInitiate = jest.fn();
jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: mockInitiate,
    getStatus: jest.fn().mockResolvedValue({ status: "SENT", method: "EMAIL", accepted_at: null }),
  }),
}));

describe("EmailConsentMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitiate.mockReset();
    mockInitiate.mockResolvedValue({ token: "mock-email-token", status: "SENT" });
  });

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

  it("409 consent_channel_unavailable muestra el mensaje, ofrece PRESENT y no queda en enviado", async () => {
    mockInitiate.mockRejectedValue(new ConsentChannelUnavailableError("EMAIL", "delivery_not_confirmed", "Conflict"));
    const onUsePresent = jest.fn();
    const user = userEvent.setup();
    render(<EmailConsentMethod applicationId="app-1" applicationReady onUsePresent={onUsePresent} />);
    await user.type(screen.getByTestId("email-input"), "cliente@ejemplo.com");
    await user.click(screen.getByTestId("email-send"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/no está disponible/i);
    expect(screen.queryByTestId("consent-status-poller")).not.toBeInTheDocument();
    expect(screen.queryByTestId("email-consent-link")).not.toBeInTheDocument();
    expect(forgeToast.success).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("email-use-present"));
    expect(onUsePresent).toHaveBeenCalled();
  });

  it("una respuesta con estado mock_sent no se trata como enviada", async () => {
    mockInitiate.mockResolvedValue({ token: "mock-email-token", status: "mock_sent" });
    const user = userEvent.setup();
    render(<EmailConsentMethod applicationId="app-1" applicationReady />);
    await user.type(screen.getByTestId("email-input"), "cliente@ejemplo.com");
    await user.click(screen.getByTestId("email-send"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByTestId("consent-status-poller")).not.toBeInTheDocument();
    expect(forgeToast.success).not.toHaveBeenCalled();
  });
});
