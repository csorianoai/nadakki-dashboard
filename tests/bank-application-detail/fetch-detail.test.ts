import { BANK_APPLICATION_AUTH_TOKEN_KEY } from "@/lib/bank-application-detail/constants";
import { BankApplicationAuthError, BankApplicationHttpError } from "@/lib/bank-application-detail/errors";
import { fetchBankApplicationDetail } from "@/lib/bank-application-detail/fetch-detail";
import { makeBankTestJwt } from "./test-token";

describe("fetchBankApplicationDetail", () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
    localStorage.clear();
  });

  test("throws BankApplicationAuthError when token missing", async () => {
    await expect(fetchBankApplicationDetail("app-1")).rejects.toBeInstanceOf(BankApplicationAuthError);
  });

  test("throws BankApplicationAuthError when JWT has no tid (cannot build headers)", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "x" })).toString("base64url");
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, `${header}.${payload}.x`);
    await expect(fetchBankApplicationDetail("app-1")).rejects.toBeInstanceOf(BankApplicationAuthError);
  });

  test("returns JSON on 200 and sends GET to /api/v2/credit/applications/{id}", async () => {
    const jwt = makeBankTestJwt("tenant-z");
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, jwt);
    const body = {
      application_id: "app-1",
      queue_status: "pending",
      borrower_name_masked: "F. *** L",
      amount: 1,
      currency: "DOP",
      dealer: { id: "d", name: "D" },
      borrower: {},
      vehicle: {},
      scoring: {},
    };
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const res = await fetchBankApplicationDetail("app-1");
    expect(res.application_id).toBe("app-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-1",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${jwt}`);
    expect(headers["X-Tenant-ID"]).toBe("tenant-z");
    expect(headers["X-Role"]).toBe("BANK_ANALYST");
    expect(headers["X-Correlation-ID"]).toBeDefined();
  });

  test("throws BankApplicationHttpError with status 404", async () => {
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, makeBankTestJwt("t"));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ code: "NOT_FOUND" }),
    }) as unknown as typeof fetch;

    await expect(fetchBankApplicationDetail("missing")).rejects.toMatchObject({
      name: "BankApplicationHttpError",
      status: 404,
    });
  });

  test("throws BankApplicationHttpError with status 401", async () => {
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, makeBankTestJwt("t"));
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "unauthorized" }),
    }) as unknown as typeof fetch;

    try {
      await fetchBankApplicationDetail("app");
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(BankApplicationHttpError);
      expect((e as BankApplicationHttpError).status).toBe(401);
    }
  });
});
