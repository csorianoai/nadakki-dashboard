import { fetchTenantBranding } from "@/lib/credit-hub/api/tenant-branding-client";

describe("tenant branding browser URL", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("uses the same-origin BFF even when a public API host is configured", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ display_name: "Pilot" }),
    });
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: fetchMock });

    await fetchTenantBranding("pilot");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/tenants/pilot/branding",
      expect.objectContaining({ headers: expect.anything() }),
    );
    expect(fetchMock.mock.calls[0][0]).not.toContain("api.nadakki.com");
  });
});
