describe("login HTTP errors", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.example";
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({ detail: "Invalid credentials" }),
    }) as jest.Mock;
  });

  afterEach(() => jest.restoreAllMocks());

  test("reports invalid credentials, not a network failure", async () => {
    const { loginV2 } = require("../../lib/api/auth-v2");
    const result = await loginV2("missing@example.com", "wrong");
    expect(result).toEqual({
      ok: false,
      status: 401,
      error: "Credenciales inválidas.",
    });
  });
});
