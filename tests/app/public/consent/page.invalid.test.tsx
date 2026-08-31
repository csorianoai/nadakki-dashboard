/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ token: "bad" }),
  usePathname: () => "/consent/bad",
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => require("@/lib/credit-hub/i18n/locales/es-DO/credit-hub").CREDIT_HUB_ES_DO,
}));

// El rechazo tiene que ser un ConsentTokenInvalidError DE VERDAD, la misma clase
// que la pagina compara con `instanceof`. Antes este mock rechazaba con un Error
// generico y aun asi esperaba la vista de "invalido": afirmaba el defecto que
// cerro el LOOP 10 -un fallo de transporte disfrazado de token invalido- y por
// eso no podia detectarlo.
class ConsentTokenInvalidErrorStub extends Error {
  name = "ConsentTokenInvalidError";
}

jest.mock("@/lib/credit-hub/api/public-consent-client", () => ({
  isUsableStatus: (status: string) => ["INITIATED", "SENT", "VIEWED", "ACCEPTED"].includes(status),
  PublicConsentClient: jest.fn().mockImplementation(() => ({
    getStatus: jest.fn().mockRejectedValue(new ConsentTokenInvalidErrorStub("Token inválido")),
    getPublicView: jest.fn(),
  })),
  ConsentTokenInvalidError: ConsentTokenInvalidErrorStub,
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
