import { render, screen, waitFor } from "@testing-library/react";
import { ConsentStatusPoller } from "@/components/credit-hub/dealer/wizard/consent/ConsentStatusPoller";
import { useConsentStatusPolling } from "@/lib/credit-hub/hooks/useConsentStatusPolling";

import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

jest.mock("@/lib/credit-hub/hooks/useConsentStatusPolling");

const mockUseConsentStatusPolling = useConsentStatusPolling as jest.MockedFunction<typeof useConsentStatusPolling>;

describe("ConsentStatusPoller", () => {
  beforeEach(() => {
    mockUseConsentStatusPolling.mockReturnValue({
      status: "SENT",
      acceptedAt: null,
      error: null,
      haltedByErrors: false,
      refetch: jest.fn(),
    });
  });

  it("renders initial status", () => {
    render(<ConsentStatusPoller token="tok" method="WHATSAPP" />);
    expect(screen.getByTestId("consent-status-poller")).toBeInTheDocument();
    expect(screen.getByText(/esperando firma/i)).toBeInTheDocument();
  });

  it("calls onComplete when ACCEPTED", async () => {
    const onComplete = jest.fn();
    mockUseConsentStatusPolling.mockReturnValue({
      status: "ACCEPTED",
      acceptedAt: "2026-04-28T15:00:00Z",
      error: null,
      haltedByErrors: false,
      refetch: jest.fn(),
    });
    render(<ConsentStatusPoller token="tok" method="WHATSAPP" onComplete={onComplete} />);
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({ method: "WHATSAPP" });
    });
  });

  it.each(["mock_sent", "SIMULATED", "algo_raro"])("el estado %s no se pinta como enviado", (status) => {
    mockUseConsentStatusPolling.mockReturnValue({
      status,
      acceptedAt: null,
      error: null,
      haltedByErrors: false,
      refetch: jest.fn(),
    });
    render(<ConsentStatusPoller token="tok" method="EMAIL" />);
    expect(screen.getByText(/Estado no confirmado/i)).toBeInTheDocument();
    expect(screen.queryByText(/enviado/i)).not.toBeInTheDocument();
  });
});
