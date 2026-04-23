import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { SpyFuClient } from "@/lib/api/spyfu-client";
import {
  BudgetExceededError,
  FeatureDisabledError,
  MissingTenantError,
  NetworkError,
  TenantMismatchError,
  UnknownIntentError,
} from "@/types/spyfu";

const BASE = "http://spyfu.test";

function jsonResponse(body: unknown, status = 200) {
  const text = JSON.stringify(body);
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "ERR",
    text: async () => text,
  });
}

describe("SpyFuClient (fetch-mocked)", () => {
  let client: SpyFuClient;
  const mockFetch = jest.fn();

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = BASE;
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID = "tenant-a";
    client = new SpyFuClient();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("getUsage parses JSON body", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse({
        calls_made: 10,
        cache_hits: 4,
        rows_used: 20,
        rows_cap: 100,
        percent_used: 20,
        cost_estimate_usd: 1.23,
      })
    );
    const u = await client.getUsage("tenant-a");
    expect(u.rows_used).toBe(20);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/spyfu/usage/tenant-a`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Tenant-ID": "tenant-a",
        }),
      })
    );
  });

  it("maps HTTP 400 to MissingTenantError", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse({ detail: "X-Tenant-ID header required" }, 400)
    );
    await expect(client.getAds("x.com")).rejects.toBeInstanceOf(MissingTenantError);
  });

  it("maps HTTP 403 to TenantMismatchError", async () => {
    mockFetch.mockImplementation(() => jsonResponse({ detail: "tenant_mismatch" }, 403));
    await expect(client.getAds("x.com")).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("maps HTTP 422 chat to UnknownIntentError with examples", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse(
        {
          detail: {
            error: "unknown_intent",
            examples: { es: ["a"], en: ["b"] },
          },
        },
        422
      )
    );
    const err422 = await client.chat("??").catch((e) => e);
    expect(err422).toBeInstanceOf(UnknownIntentError);
    expect((err422 as UnknownIntentError).examples.en).toContain("b");
  });

  it("maps HTTP 429 to BudgetExceededError", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse(
        {
          detail: {
            error: "spyfu_budget_exceeded",
            rows_used: 99,
            rows_cap: 100,
            endpoint: "x",
          },
        },
        429
      )
    );
    const err429 = await client.analyzeCompetitor("x.com").catch((e) => e);
    expect(err429).toBeInstanceOf(BudgetExceededError);
    expect((err429 as BudgetExceededError).rows_cap).toBe(100);
  });

  it("maps HTTP 503 to FeatureDisabledError", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse({ detail: { error: "feature_disabled" } }, 503)
    );
    await expect(client.getKeywords("x.com")).rejects.toBeInstanceOf(FeatureDisabledError);
  });

  it("analyzeCompetitor sends tenant_id in body", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse({
        data: {},
        meta: { cache_hit: false, cost_estimate: 1, fetched_at: "t" },
        confidence: { overall: "high" },
      })
    );
    await client.analyzeCompetitor("boatsetter.com", "US", "tenant-a");
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      tenant_id: "tenant-a",
      competitor_domain: "boatsetter.com",
      country_code: "US",
    });
  });

  it("chat includes tenant_id in JSON body", async () => {
    mockFetch.mockImplementation(() =>
      jsonResponse({
        reply_markdown: "ok",
        tool: "t",
        language: "en",
        meta: {},
      })
    );
    await client.chat("hello", { countryCode: "US" });
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      message: "hello",
      language: "auto",
      country_code: "US",
      tenant_id: "tenant-a",
    });
  });

  it("throws NetworkError when fetch rejects", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("offline")));
    await expect(client.getAds("x.com")).rejects.toBeInstanceOf(NetworkError);
  });
});
