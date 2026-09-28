describe("login tenant context binding", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.example";
    jest.resetModules();
  });

  afterEach(() => jest.restoreAllMocks());

  test("accepts the backend tenant when it matches the requested portal slug", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "access",
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 900,
        user_info: { id: "u1", email: "dealer@example.com", is_active: true, mfa_enabled: false },
        tenant_info: { id: "t1", slug: "mapaal", display_name: "Mapaal", subscribed_cores: [] },
        active_role: { core_name: "credit", role_key: "dealer", display_name: "Dealer" },
        mfa_required: false,
      }),
    }) as jest.Mock;

    const { loginV2 } = require("../../lib/api/auth-v2");
    const result = await loginV2("dealer@example.com", "correct-password", "mapaal");

    expect(result.ok).toBe(true);
    expect(result.data.tenant_info.slug).toBe("mapaal");
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toMatchObject({
      tenant_slug: "mapaal",
    });
  });

  test("fails closed without disclosing the tenant when backend returns another slug", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "wrong-access",
        refresh_token: "wrong-refresh",
        token_type: "bearer",
        expires_in: 900,
        user_info: { id: "u2", email: "dealer@example.com", is_active: true, mfa_enabled: false },
        tenant_info: { id: "t2", slug: "other-dealer", display_name: "Other Dealer", subscribed_cores: [] },
        active_role: { core_name: "credit", role_key: "dealer", display_name: "Dealer" },
        mfa_required: false,
      }),
    }) as jest.Mock;

    const { AUTH_TENANT_CONTEXT_MISMATCH, loginV2 } = require("../../lib/api/auth-v2");
    const result = await loginV2("dealer@example.com", "correct-password", "mapaal");

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: AUTH_TENANT_CONTEXT_MISMATCH,
    });
    expect(result.error).toBe("contexto de acceso no corresponde a este portal");
    expect(result.error).not.toMatch(/other-dealer/i);
  });
});
