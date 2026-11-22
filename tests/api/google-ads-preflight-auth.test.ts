/** @jest-environment node */
/**
 * Misma causa que google-ads-agent-ops-auth.test.ts: #2537 puso require_auth y tenant == JWT en
 * /api/v1/tenants/{id}/google-ads/{readiness,readiness/refresh,preflight}; el dashboard llamaba con fetch() a secas.
 */
import { postGoogleAdsPreflight } from "@/lib/api/googleAdsPreflight";
import { getGoogleAdsTenantReadiness, refreshGoogleAdsTenantReadiness } from "@/lib/api/googleAdsTenantReadiness";

const mockExp = Math.floor(Date.now() / 1000) + 3600;
const TOKEN = `h.${Buffer.from(JSON.stringify({ exp: mockExp })).toString("base64url")}.s`;

jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => TOKEN, getRefreshToken: () => null },
}));

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
  (globalThis as any).fetch = fetchMock;
});
const auth = (i: number) => new Headers((fetchMock.mock.calls[i]?.[1] as RequestInit | undefined)?.headers).get("Authorization");

describe("google-ads preflight y readiness: toda llamada lleva el JWT", () => {
  it("preflight, readiness y refresh mandan Authorization: Bearer", async () => {
    await postGoogleAdsPreflight("t-1", "google_ads_m15_api");
    await getGoogleAdsTenantReadiness("t-1");
    await refreshGoogleAdsTenantReadiness("t-1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 3; i++) {
      expect(auth(i)).toBe(`Bearer ${TOKEN}`);
      expect(String(fetchMock.mock.calls[i]?.[0])).toContain("/api/v1/tenants/t-1/google-ads/");
    }
  });
});
