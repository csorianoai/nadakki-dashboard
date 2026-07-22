import { entitlementsAPI } from "@/lib/autos-portal/entitlements-api";

describe("Entitlements API Client", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => {
          if (key === "nadakki_sic_token") return "fake_token";
          if (key === "nadakki_tenant_id") return "tenant-123";
          return null;
        }),
      },
      writable: true,
    });
  });

  test("checkAccess returns ALLOWED when API succeeds", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        allowed: true,
        reason_code: "ALLOWED",
      }),
    });

    const decision = await entitlementsAPI.checkAccess("marketing.campaigns.create");
    expect(decision.allowed).toBe(true);
    expect(decision.reason_code).toBe("ALLOWED");
  });

  test("checkAccess returns DEFAULT_DENY on API error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const decision = await entitlementsAPI.checkAccess("marketing.campaigns.create");
    expect(decision.allowed).toBe(false);
    expect(decision.reason_code).toBe("DEFAULT_DENY");
  });

  test("recordUsage includes idempotency key", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recorded: true }),
    });

    await entitlementsAPI.recordUsage("marketing.campaigns.create", 1, "idempotency-123");

    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(call[1].body)).toContain("idempotency_key");
  });

  test("getEffectiveCapabilities returns capability map", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        capabilities: {
          "inventory.vehicle.publish": {
            allowed: true,
            source: "UNIVERSAL_AUTO_BASELINE",
            limits: null,
          },
        },
      }),
    });

    const caps = await entitlementsAPI.getEffectiveCapabilities("dealer-123");
    expect(caps?.["inventory.vehicle.publish"]?.allowed).toBe(true);
  });
});
