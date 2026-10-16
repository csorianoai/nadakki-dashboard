import { ConsentApiClient, ConsentChannelUnavailableError, isConfirmedSent } from "@/lib/credit-hub/api/consent-client";

function jsonResponse(status: number, body: unknown): Response {
  const res = { ok: status < 400, status, statusText: `HTTP ${status}`, clone: () => res, json: async () => body };
  return res as unknown as Response;
}

describe("ConsentApiClient (canales no disponibles)", () => {
  const client = new ConsentApiClient("tenant-qa");
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("409 consent_channel_unavailable de initiate lanza ConsentChannelUnavailableError con canal y motivo", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { detail: { code: "consent_channel_unavailable", channel: "EMAIL", reason: "delivery_not_confirmed" } })
    );
    const err = await client.initiate("app-1", "EMAIL", { email: "a@b.co" }).catch((e) => e);
    expect(err).toBeInstanceOf(ConsentChannelUnavailableError);
    expect(err.channel).toBe("EMAIL");
    expect(err.reason).toBe("delivery_not_confirmed");
  });

  it("un 409 con otro código sigue siendo un Error genérico", async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { detail: "conflicto" }));
    const err = await client.initiate("app-1", "PRESENT", {}).catch((e) => e);
    expect(err).not.toBeInstanceOf(ConsentChannelUnavailableError);
    expect(err.message).toBe("conflicto");
  });

  it("solo SENT cuenta como enviado", () => {
    expect(isConfirmedSent("SENT")).toBe(true);
    for (const s of ["mock_sent", "INITIATED", "sent", "", undefined, null]) expect(isConfirmedSent(s)).toBe(false);
  });
});
