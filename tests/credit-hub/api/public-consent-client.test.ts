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
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      "/api/v2/credit/consent/email-token/status",
      "/api/v2/credit/consent/email-token/public",
    ]);
  });

  test("server expiration remains invalid even when the client receives a future-looking view", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      response({ status: "EXPIRED" }, 200),
    );
    Object.defineProperty(global, "fetch", { value: fetchMock, writable: true });

    await expect(new PublicConsentClient().getView("expired-token")).rejects.toBeInstanceOf(ConsentTokenInvalidError);
  });
});
