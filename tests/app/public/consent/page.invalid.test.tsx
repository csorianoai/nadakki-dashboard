/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ token: "bad" }),
}));

jest.mock("@/lib/credit-hub/api/public-consent-client", () => ({
  PublicConsentClient: jest.fn().mockImplementation(() => ({
    getView: jest.fn().mockRejectedValue(new Error("Token inválido")),
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
