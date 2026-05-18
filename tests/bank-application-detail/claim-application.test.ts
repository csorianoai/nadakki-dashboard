import { BANK_APPLICATION_AUTH_TOKEN_KEY } from "@/lib/bank-application-detail/constants";
import { claimBankApplication } from "@/lib/bank-application-detail/claim-application";
import { BankApplicationAuthError } from "@/lib/bank-application-detail/errors";
import { makeBankTestJwt } from "./test-token";

describe("claimBankApplication", () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
    localStorage.clear();
  });

  test("POSTs to claim URL with auth headers", async () => {
    const jwt = makeBankTestJwt("tid-claim");
    localStorage.setItem(BANK_APPLICATION_AUTH_TOKEN_KEY, jwt);
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 204 });
    global.fetch = mockFetch as unknown as typeof fetch;

    const res = await claimBankApplication("app-uuid");
    expect(res.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-uuid/claim",
      expect.objectContaining({ method: "POST" }),
    );
    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-Role"]).toBe("BANK_ANALYST");
    expect(headers["X-Tenant-ID"]).toBe("tid-claim");
  });

  test("rejects without token", async () => {
    await expect(claimBankApplication("x")).rejects.toBeInstanceOf(BankApplicationAuthError);
  });
});
