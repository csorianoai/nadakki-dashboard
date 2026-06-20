import { listOffers } from "@/lib/credit-hub/api/offersClient";
import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";

const tenantId = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";

function mockFetch(body: unknown, ok = true, status = 200) {
  const fn = jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    clone: () => ({ json: async () => body }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  Object.defineProperty(global, "fetch", { value: fn, writable: true, configurable: true });
  return fn;
}

const sampleOffers = {
  application_id: "app-1",
  tenant_id: tenantId,
  offers: [
    {
      id: "off-1",
      application_id: "app-1",
      tenant_id: tenantId,
      lender_code: "banco_popular",
      amount_approved: 500000,
      interest_rate_apr: 12.5,
      term_months: 48,
      monthly_payment: 13200,
      status: "approved",
      created_at: "2026-06-20T00:00:00Z",
    },
  ],
  pagination: { limit: 20, offset: 0, total: 1 },
};

describe("offersClient.listOffers", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("uses the /credit base path WITHOUT /api/v2 and sends X-Tenant-ID", async () => {
    const fetchMock = mockFetch(sampleOffers);
    await listOffers({ tenantId, applicationId: "app-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/credit/applications/app-1/offers",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "X-Tenant-ID": tenantId }),
      })
    );
  });

  test("normalizes the offers list response", async () => {
    mockFetch(sampleOffers);
    const res = await listOffers({ tenantId, applicationId: "app-1" });
    expect(res.offers).toHaveLength(1);
    expect(res.offers[0].id).toBe("off-1");
    expect(res.offers[0].lender_code).toBe("banco_popular");
    expect(res.offers[0].amount_approved).toBe(500000);
    expect(res.offers[0].interest_rate_apr).toBe(12.5);
    expect(res.offers[0].monthly_payment).toBe(13200);
    expect(res.pagination.total).toBe(1);
  });

  test("passes limit/offset query params only when provided", async () => {
    const fetchMock = mockFetch({ offers: [], pagination: { limit: 5, offset: 10, total: 0 } });
    await listOffers({ tenantId, applicationId: "app-1", limit: 5, offset: 10 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/credit/applications/app-1/offers?limit=5&offset=10",
      expect.any(Object)
    );
  });

  test("handles an empty offers list", async () => {
    mockFetch({ application_id: "app-1", offers: [], pagination: { limit: 20, offset: 0, total: 0 } });
    const res = await listOffers({ tenantId, applicationId: "app-1" });
    expect(res.offers).toEqual([]);
    expect(res.pagination.total).toBe(0);
  });

  test("defensively normalizes missing numeric fields to null (no fake zeros)", async () => {
    mockFetch({
      offers: [{ id: "off-2", lender_code: "banco_bhd", status: "pending" }],
      pagination: { limit: 20, offset: 0, total: 1 },
    });
    const res = await listOffers({ tenantId, applicationId: "app-1" });
    expect(res.offers[0].amount_approved).toBeNull();
    expect(res.offers[0].interest_rate_apr).toBeNull();
    expect(res.offers[0].term_months).toBeNull();
    expect(res.offers[0].monthly_payment).toBeNull();
  });

  test("throws CreditCoreApiError on backend error", async () => {
    mockFetch({ detail: "Forbidden" }, false, 403);
    await expect(listOffers({ tenantId, applicationId: "app-1" })).rejects.toBeInstanceOf(
      CreditCoreApiError
    );
  });
});
