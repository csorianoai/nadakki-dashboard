/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => null),
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-agent" />,
}));

jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({
  GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="forge-shell">{children}</div>
  ),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => require("@/lib/credit-hub/i18n/locales/es-DO/credit-hub").CREDIT_HUB_ES_DO,
}));

jest.mock("@/lib/credit-hub/api/public-consent-client", () => {
  const validData = {
    application_id: "app-tree-test",
    method: "EMAIL",
    institution_name: "Institucion de prueba",
    branding: { logo_url: null, primary_color: "#2563eb" },
    regulatory_texts: { LEY_172_13: "Texto" },
    consents_required: ["LEY_172_13"],
    expires_at: "2099-01-01T00:00:00Z",
  };

  return {
    isUsableStatus: (status: string) => ["INITIATED", "SENT", "VIEWED", "ACCEPTED"].includes(status),
    PublicConsentClient: jest.fn().mockImplementation(() => ({
      getStatus: jest.fn().mockResolvedValue({ status: "SENT" }),
      getPublicView: jest.fn().mockResolvedValue(validData),
      accept: jest.fn(),
    })),
    ConsentTokenInvalidError: class extends Error {
      name = "ConsentTokenInvalidError";
    },
    ConsentOtpInvalidError: class extends Error {
      name = "ConsentOtpInvalidError";
    },
  };
});

import PublicConsentPage from "@/app/(public)/consent/[token]/page";
import AppGate from "@/components/auth/AppGate";

describe("public consent route tree", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/consent/tree-token");
    const { PublicConsentClient } = require("@/lib/credit-hub/api/public-consent-client") as {
      PublicConsentClient: jest.Mock;
    };
    PublicConsentClient.mockClear();
  });

  it("lets the consent route mount from the browser path while usePathname is unresolved", async () => {
    render(
      <AppGate>
        <PublicConsentPage />
      </AppGate>
    );

    await waitFor(() => expect(screen.getByTestId("consent-checkboxes")).toBeInTheDocument());
    expect(screen.queryByTestId("protected-route")).not.toBeInTheDocument();

    const client = (require("@/lib/credit-hub/api/public-consent-client") as {
      PublicConsentClient: jest.Mock;
    }).PublicConsentClient.mock.results[0].value;
    expect(client.getStatus).toHaveBeenCalledWith("tree-token");
  });
});
