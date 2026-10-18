import { ConsentApiClient, ConsentChannelUnavailableError, isConfirmedSent } from "@/lib/credit-hub/api/consent-client";

describe("consent-client", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("getPresentText falla cerrado sin hacer ninguna petición", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const res = await new ConsentApiClient("tenant-qa").getPresentText("app-1");
    expect(res).toEqual({ consent_text: null, consent_text_version: null, unavailable: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("initiate tipa el 409 consent_channel_unavailable", async () => {
    const body = { detail: { code: "consent_channel_unavailable", channel: "EMAIL", reason: "sin_proveedor" } };
    const response = { ok: false, status: 409, statusText: "Conflict", clone: () => ({ json: async () => body }) };
    global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
    await expect(new ConsentApiClient("tenant-qa").initiate("app-1", "EMAIL", {})).rejects.toBeInstanceOf(ConsentChannelUnavailableError);
  });

  it("solo SENT cuenta como enviado", () => {
    expect(isConfirmedSent("SENT")).toBe(true);
    expect(isConfirmedSent("mock_sent")).toBe(false);
    expect(isConfirmedSent(undefined)).toBe(false);
  });
});
