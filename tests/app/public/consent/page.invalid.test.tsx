/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ token: "bad" }),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => require("@/lib/credit-hub/i18n/locales/es-DO/credit-hub").CREDIT_HUB_ES_DO,
}));

jest.mock("@/lib/credit-hub/api/public-consent-client", () => ({
  isUsableStatus: (status: string) => ["INITIATED", "SENT", "VIEWED", "ACCEPTED"].includes(status),
  PublicConsentClient: jest.fn().mockImplementation(() => ({
    getStatus: jest.fn().mockRejectedValue(new Error("Token inválido")),
    getPublicView: jest.fn(),
  })),
  ConsentTokenInvalidError: class extends Error {
    name = "ConsentTokenInvalidError";
  },
  ConsentOtpInvalidError: class extends Error {
    name = "ConsentOtpInvalidError";
  },
}));

import PublicConsentPage from "@/app/(public)/consent/[token]/page";

describe("PublicConsentPage — invalid token", () => {
  it("shows invalid view on token error", async () => {
    render(<PublicConsentPage />);
    await waitFor(() => {
      expect(screen.getByTestId("consent-invalid")).toBeInTheDocument();
    });
  });
});
