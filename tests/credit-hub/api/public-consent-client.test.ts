import { PublicConsentClient, ConsentTokenInvalidError } from "@/lib/credit-hub/api/public-consent-client";

const view = {
  application_id: "app-1",
  method: "EMAIL",
  institution_name: "Cooperativa Test",
  branding: {},
  regulatory_texts: {},
  consents_required: ["LEY_172_13"],
  expires_at: "2099-01-01T00:00:00Z",
};

function response(body: unknown, status: number): Response {
  const value = {
    status,
    ok: status >= 200 && status < 300,
    statusText: "",
    clone() { return this; },
    async json() { return body; },
    async text() { return JSON.stringify(body); },
  };
  return value as unknown as Response;
}

describe("PublicConsentClient", () => {
  afterEach(() => jest.restoreAllMocks());

  test("asks the server for token status before loading the public view", async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(response({ status: "SENT" }, 200))
      .mockResolvedValueOnce(response(view, 200));
    Object.defineProperty(global, "fetch", { value: fetchMock, writable: true });

    await expect(new PublicConsentClient().getView("email-token")).resolves.toEqual(view);
    // Las rutas se declaran LITERALES a proposito. Derivarlas de
    // process.env.NEXT_PUBLIC_API_URL -como hacia este test- las hacia iguales a
    // las del codigo por construccion: el test pasaba con cualquier host y no
    // podia detectar que staging pedia a https://api.nadakki.com.
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      "/api/v2/credit/consent/email-token/status",
      "/api/v2/credit/consent/email-token/public",
    ]);
  });

  test("keeps consent requests same-origin even when NEXT_PUBLIC_API_URL points elsewhere", async () => {
    // La causa medida en staging: NEXT_PUBLIC_API_URL quedo horneada como
    // https://api.nadakki.com, el cliente construyo una URL ABSOLUTA a un host
    // ausente del connect-src del CSP, el navegador corto el fetch antes de
    // emitirlo -0 requests a /api/ en 39 capturados- y el .catch de la pagina
    // lo pinto como "enlace invalido o expirado".
    //
    // La ruta publica se sirve por el rewrite /api/v2/credit/:path* de
    // next.config.js, medido a 200. Same-origin es SIEMPRE correcto aqui y
    // ademas 'self' siempre esta en el CSP.
    const prev = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.nadakki.com";
    try {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(response({ status: "SENT" }, 200))
        .mockResolvedValueOnce(response(view, 200));
      Object.defineProperty(global, "fetch", { value: fetchMock, writable: true });

      await new PublicConsentClient().getView("email-token");

      for (const [input] of fetchMock.mock.calls) {
        const url = String(input);
        expect(url.startsWith("/api/v2/credit/consent/")).toBe(true);
        expect(url).not.toContain("api.nadakki.com");
        expect(/^https?:\/\//.test(url)).toBe(false);
      }
    } finally {
      process.env.NEXT_PUBLIC_API_URL = prev;
    }
  });

  test("does not trust an unknown server status", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(response({ status: "UNKNOWN" }, 200));
    Object.defineProperty(global, "fetch", { value: fetchMock, writable: true });

    await expect(new PublicConsentClient().getView("unknown-token")).rejects.toBeInstanceOf(ConsentTokenInvalidError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("server expiration remains invalid even when the client receives a future-looking view", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      response({ status: "EXPIRED" }, 200),
    );
    Object.defineProperty(global, "fetch", { value: fetchMock, writable: true });

    await expect(new PublicConsentClient().getView("expired-token")).rejects.toBeInstanceOf(ConsentTokenInvalidError);
  });
});
