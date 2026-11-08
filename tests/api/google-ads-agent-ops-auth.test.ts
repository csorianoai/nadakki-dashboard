/** @jest-environment node */
/**
 * Regresion del release f77ba934: el backend empezo a exigir JWT de plataforma en
 * /api/v1/ops/google-ads-agent/* (#2537) y /admin/google-ads-agent respondia «missing_auth»
 * porque lib/api/googleAdsAgentOps.ts llamaba con fetch() a secas, sin Authorization.
 */
import {
  getGoogleAdsAgentCheckByRunId,
  getGoogleAdsAgentCheckHistory,
  getGoogleAdsAgentCheckLatest,
  postGoogleAdsAgentCheckRun,
} from "@/lib/api/googleAdsAgentOps";

const mockExp = Math.floor(Date.now() / 1000) + 3600;
const TOKEN = `h.${Buffer.from(JSON.stringify({ exp: mockExp })).toString("base64url")}.s`;

jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => TOKEN, getRefreshToken: () => null },
}));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ runs: [], run: {} }), { status: 200 }));
  (globalThis as any).fetch = fetchMock;
});

function cabecera(llamada: number, nombre: string): string | null {
  const init = fetchMock.mock.calls[llamada]?.[1] as RequestInit | undefined;
  return new Headers(init?.headers).get(nombre);
}

describe("google-ads-agent ops: toda llamada lleva el JWT", () => {
  it("run, latest, history y by-run-id mandan Authorization: Bearer", async () => {
    await postGoogleAdsAgentCheckRun("t-1");
    await getGoogleAdsAgentCheckLatest("t-1");
    await getGoogleAdsAgentCheckHistory("t-1");
    await getGoogleAdsAgentCheckByRunId("11111111-1111-1111-1111-111111111111", "t-1");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (let i = 0; i < 4; i++) {
      expect(cabecera(i, "Authorization")).toBe(`Bearer ${TOKEN}`);
      expect(String(fetchMock.mock.calls[i]?.[0])).toContain("/api/v1/ops/google-ads-agent/checks");
    }
  });

  it("sigue mandando X-Tenant-ID cuando se da el tenant", async () => {
    await getGoogleAdsAgentCheckLatest("t-1");
    expect(cabecera(0, "X-Tenant-ID")).toBe("t-1");
  });
});
