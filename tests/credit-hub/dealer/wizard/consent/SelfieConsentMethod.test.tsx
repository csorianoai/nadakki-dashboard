import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelfieConsentMethod } from "@/components/credit-hub/dealer/wizard/consent/SelfieConsentMethod";

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/hooks/useConsentApi", () => ({
  useConsentApi: () => ({
    initiate: jest.fn().mockResolvedValue({ token: "selfie-token", status: "SENT" }),
    getStatus: jest.fn().mockResolvedValue({ status: "SENT", method: "SELFIE", accepted_at: null }),
  }),
}));

describe("SelfieConsentMethod", () => {
  it("shows poller after send", async () => {
    const user = userEvent.setup();
    render(<SelfieConsentMethod applicationId="app-1" applicationReady />);
    await user.type(screen.getByTestId("selfie-phone-input"), "+1-809-555-1234");
    await user.click(screen.getByTestId("selfie-send"));
    await waitFor(() => {
      expect(screen.getByTestId("consent-status-poller")).toBeInTheDocument();
    });
  });
});
