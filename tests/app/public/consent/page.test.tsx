/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ token: "valid-token" })),
  usePathname: jest.fn(() => "/consent/valid-token"),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => require("@/lib/credit-hub/i18n/locales/es-DO/credit-hub").CREDIT_HUB_ES_DO,
}));

jest.mock("@/lib/credit-hub/api/public-consent-client", () => {
  const validData = {
    application_id: "app-1",
    method: "WHATSAPP",
    institution_name: "Cooperativa Test",
    branding: { logo_url: null, primary_color: "#0066CC" },
    regulatory_texts: {
      LEY_172_13: "Texto Ley 172-13...",
      BURO: "Texto buró...",
      DATA_POLICY: "Texto data policy...",
    },
    consents_required: ["LEY_172_13", "BURO", "DATA_POLICY"],
    expires_at: "2026-12-31T00:00:00Z",
  };

  return {
    isUsableStatus: (status: string) => ["INITIATED", "SENT", "VIEWED", "ACCEPTED"].includes(status),
    PublicConsentClient: jest.fn().mockImplementation(() => ({
      getStatus: jest.fn().mockResolvedValue({ status: "SENT" }),
      getPublicView: jest.fn().mockResolvedValue(validData),
      accept: jest.fn().mockResolvedValue({
        accepted_at: "2026-04-28T15:00:00Z",
        audit_hash: "abc123def456",
      }),
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

describe("PublicConsentPage", () => {
  beforeEach(() => {
    const { PublicConsentClient } = require("@/lib/credit-hub/api/public-consent-client") as {
      PublicConsentClient: jest.Mock;
    };
    PublicConsentClient.mockClear();
  });

  afterEach(() => {
    const navigation = require("next/navigation") as {
      useParams: jest.Mock;
      usePathname: jest.Mock;
    };
    navigation.useParams.mockReturnValue({ token: "valid-token" });
    navigation.usePathname.mockReturnValue("/consent/valid-token");
  });

  it("reads the token from the real consent pathname when params are empty", async () => {
    const navigation = require("next/navigation") as {
      useParams: jest.Mock;
      usePathname: jest.Mock;
    };
    navigation.useParams.mockReturnValue({});
    navigation.usePathname.mockReturnValue("/consent/path-token");

    render(<PublicConsentPage />);
    await waitFor(() => expect(screen.getByTestId("consent-checkboxes")).toBeInTheDocument());

    const clients = (require("@/lib/credit-hub/api/public-consent-client") as {
      PublicConsentClient: jest.Mock;
    }).PublicConsentClient.mock.results.map((result) => result.value);
    expect(clients.some((client) => client.getStatus.mock.calls.some(([value]) => value === "path-token"))).toBe(true);
  });

  it("checks the server status before loading a valid token", async () => {
    render(<PublicConsentPage />);
    await waitFor(() => expect(screen.getByTestId("consent-checkboxes")).toBeInTheDocument());

    const client = (require("@/lib/credit-hub/api/public-consent-client") as {
      PublicConsentClient: jest.Mock;
    }).PublicConsentClient.mock.results[0].value;
    expect(client.getStatus).toHaveBeenCalledWith("valid-token");
  });

  it("rejects a token when the server reports it expired", async () => {
    const { PublicConsentClient } = require("@/lib/credit-hub/api/public-consent-client") as {
      PublicConsentClient: jest.Mock;
    };
    PublicConsentClient.mockImplementationOnce(() => ({
      getStatus: jest.fn().mockResolvedValue({ status: "EXPIRED" }),
      getPublicView: jest.fn(),
    }));

    render(<PublicConsentPage />);
    await waitFor(() => expect(screen.getByTestId("consent-invalid")).toBeInTheDocument());
  });

  it("shows loading initially then form", async () => {
    render(<PublicConsentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("consent-checkboxes")).toBeInTheDocument();
    });
  });

  it("renders institution branding header", async () => {
    render(<PublicConsentPage />);
    await waitFor(() => {
      expect(screen.getByText("Cooperativa Test")).toBeInTheDocument();
    });
  });

  it("renders all consent checkboxes", async () => {
    render(<PublicConsentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("consent-checkbox-ley_172_13")).toBeInTheDocument();
      expect(screen.getByTestId("consent-checkbox-buro")).toBeInTheDocument();
      expect(screen.getByTestId("consent-checkbox-data_policy")).toBeInTheDocument();
    });
  });

  it("disables submit until all checkboxes + signature", async () => {
    const user = userEvent.setup();
    render(<PublicConsentPage />);
    await waitFor(() => screen.getByTestId("consent-submit"));
    expect(screen.getByTestId("consent-submit")).toBeDisabled();

    await user.click(screen.getByTestId("consent-checkbox-ley_172_13"));
    expect(screen.getByTestId("consent-submit")).toBeDisabled();
  });

  it("enables submit when all required + signature filled", async () => {
    const user = userEvent.setup();
    render(<PublicConsentPage />);
    await waitFor(() => screen.getByTestId("consent-submit"));

    await user.click(screen.getByTestId("consent-checkbox-ley_172_13"));
    await user.click(screen.getByTestId("consent-checkbox-buro"));
    await user.click(screen.getByTestId("consent-checkbox-data_policy"));
    await user.type(screen.getByTestId("signature-input"), "Juan Antonio Pérez");

    expect(screen.getByTestId("consent-submit")).not.toBeDisabled();
  });

  it("shows success view after accept", async () => {
    const user = userEvent.setup();
    render(<PublicConsentPage />);
    await waitFor(() => screen.getByTestId("consent-submit"));

    await user.click(screen.getByTestId("consent-checkbox-ley_172_13"));
    await user.click(screen.getByTestId("consent-checkbox-buro"));
    await user.click(screen.getByTestId("consent-checkbox-data_policy"));
    await user.type(screen.getByTestId("signature-input"), "Juan Pérez");
    await user.click(screen.getByTestId("consent-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("consent-success")).toBeInTheDocument();
    });
  });
});
