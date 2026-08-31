/** @jest-environment jsdom */

/**
 * Un fallo de transporte NO puede disfrazarse de "token invalido".
 *
 * Es el defecto de fondo del LOOP 10. En staging, el cliente pedia a
 * https://api.nadakki.com -host ausente del connect-src del CSP-, el navegador
 * cortaba el fetch antes de emitirlo, y el `.catch(() => setView("invalid"))`
 * de page.tsx pintaba "Este enlace no es valido o ha expirado".
 *
 * El usuario leyo "tu enlace expiro" durante nueve iteraciones cuando lo que
 * pasaba era un error de configuracion del despliegue. La autoridad sobre la
 * validez del token es el SERVIDOR: si el servidor no llego a responder, el
 * cliente no sabe si el token es valido y no puede afirmar que no lo es.
 */

import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useParams: () => ({ token: "tok-transporte" }),
  usePathname: () => "/consent/tok-transporte",
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () =>
    require("@/lib/credit-hub/i18n/locales/es-DO/credit-hub").CREDIT_HUB_ES_DO,
}));

class ConsentTokenInvalidErrorStub extends Error {
  name = "ConsentTokenInvalidError";
}

const getStatus = jest.fn();

jest.mock("@/lib/credit-hub/api/public-consent-client", () => ({
  isUsableStatus: (status: string) =>
    ["INITIATED", "SENT", "VIEWED", "ACCEPTED"].includes(status),
  PublicConsentClient: jest.fn().mockImplementation(() => ({
    getStatus,
    getPublicView: jest.fn(),
  })),
  ConsentTokenInvalidError: ConsentTokenInvalidErrorStub,
  ConsentOtpInvalidError: class extends Error {
    name = "ConsentOtpInvalidError";
  },
}));

import PublicConsentPage from "@/app/(public)/consent/[token]/page";

describe("PublicConsentPage — el transporte no es el token", () => {
  afterEach(() => jest.clearAllMocks());

  it("un fetch bloqueado por CSP no se muestra como enlace invalido", async () => {
    // Lo que Chrome entrega cuando el CSP corta la peticion.
    getStatus.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<PublicConsentPage />);

    await waitFor(() => {
      expect(screen.getByTestId("consent-error")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("consent-invalid")).not.toBeInTheDocument();
  });

  it("un error de red generico tampoco", async () => {
    getStatus.mockRejectedValue(new Error("NetworkError when attempting to fetch"));

    render(<PublicConsentPage />);

    await waitFor(() => {
      expect(screen.getByTestId("consent-error")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("consent-invalid")).not.toBeInTheDocument();
  });

  it("cuando el SERVIDOR dice que el token no sirve, si se muestra invalido", async () => {
    getStatus.mockRejectedValue(new ConsentTokenInvalidErrorStub("Token invalido"));

    render(<PublicConsentPage />);

    await waitFor(() => {
      expect(screen.getByTestId("consent-invalid")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("consent-error")).not.toBeInTheDocument();
  });
});
