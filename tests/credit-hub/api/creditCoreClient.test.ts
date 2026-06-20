import {
  CreditCoreApiError,
  acceptOffer,
  createApplication,
  getApplication,
  getApplicationEvents,
  getCreditHealth,
  getCreditStats,
  listApplications,
  processApplication,
} from "@/lib/credit-hub/api/creditCoreClient";

const tenantId = "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242";

function mockFetch(body: unknown, ok = true, status = 200) {
  const fn = jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    clone: () => ({
      json: async () => body,
    }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  Object.defineProperty(global, "fetch", {
    value: fn,
    writable: true,
    configurable: true,
  });
  return fn;
}

describe("creditCoreClient", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("sends X-Tenant-ID header and same-origin path", async () => {
    const fetchMock = mockFetch({ status: "ok" });
    await getCreditHealth({ tenantId });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
        }),
      })
    );
  });

  test("lists applications and normalizes response", async () => {
    mockFetch({ applications: [{ id: "app-1", applicantName: "Ana" }] });
    const apps = await listApplications({ tenantId });
    expect(apps[0].application_id).toBe("app-1");
    expect(apps[0].applicant_name).toBe("Ana");
  });

  test("gets stats", async () => {
    mockFetch({ totalApplications: 3 });
    const stats = await getCreditStats({ tenantId });
    expect(stats.total_applications).toBe(3);
  });

  test("creates application with Credit Core schema wrapper preserving payload fields", async () => {
    const fetchMock = mockFetch({ id: "app-created", applicant_name: "Ana" });
    const payload = {
      applicant_name: "Ana",
      applicant_email: "ana@example.com",
      requested_amount: "500000",
      vehicle_make: "Toyota",
      source: "forge_dealer_portal" as const,
    };
    await createApplication({
      tenantId,
      payload,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          application_payload: payload,
          initial_state: "DRAFT",
        }),
      })
    );
  });

  test("gets application, processes, and loads events", async () => {
    const fetchMock = mockFetch({ id: "app-1", applicant_name: "Ana" });
    await getApplication({ tenantId, applicationId: "app-1" });
    await processApplication({ tenantId, applicationId: "app-1", mode: "ai" });
    mockFetch({ events: [{ id: "evt-1", type: "created" }] });
    const events = await getApplicationEvents({ tenantId, applicationId: "app-1" });

    expect(fetchMock).toHaveBeenCalledWith("/api/v2/credit/applications/app-1", expect.any(Object));
    expect(events[0].id).toBe("evt-1");
  });

  test("normalizes backend errors", async () => {
    mockFetch({ detail: "No tenant" }, false, 400);
    await expect(getCreditStats({ tenantId })).rejects.toBeInstanceOf(CreditCoreApiError);
    await expect(getCreditStats({ tenantId })).rejects.toMatchObject({ status: 400 });
  });

  test("acceptOffer POSTs to /api/v2/credit offers accept path and normalizes the result", async () => {
    const fetchMock = mockFetch({
      ok: true,
      idempotent: false,
      offer: {
        offer_id: "off-1",
        application_id: "app-1",
        tenant_id: tenantId,
        lender_code: "banco_popular",
        status: "accepted",
        terms: { interest_rate_apr: 12.5 },
        accepted_at: "2026-06-20T00:00:00Z",
        accepted_by: "analyst-1",
      },
      application_state: "OFFER_SELECTED",
      previous_application_state: "PROCESSED",
      siblings_not_selected: 3,
    });

    const res = await acceptOffer({ tenantId, applicationId: "app-1", offerId: "off-1" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications/app-1/offers/off-1/accept",
      expect.objectContaining({ method: "POST" })
    );
    expect(res.ok).toBe(true);
    expect(res.idempotent).toBe(false);
    expect(res.offer.offer_id).toBe("off-1");
    expect(res.offer.status).toBe("accepted");
    expect(res.application_state).toBe("OFFER_SELECTED");
    expect(res.siblings_not_selected).toBe(3);
  });

  test("acceptOffer reports idempotent=true on retries", async () => {
    mockFetch({
      ok: true,
      idempotent: true,
      offer: { offer_id: "off-1", status: "accepted" },
      application_state: "OFFER_SELECTED",
      siblings_not_selected: 0,
    });
    const res = await acceptOffer({ tenantId, applicationId: "app-1", offerId: "off-1" });
    expect(res.idempotent).toBe(true);
  });

  test("acceptOffer surfaces typed backend error detail (offer already taken)", async () => {
    mockFetch({ detail: "Offer already accepted by another dealer" }, false, 409);
    await expect(
      acceptOffer({ tenantId, applicationId: "app-1", offerId: "off-1" })
    ).rejects.toMatchObject({ status: 409, message: "Offer already accepted by another dealer" });
  });

  test("acceptOffer rejects a crossed response whose echoed application_id/tenant_id mismatch", async () => {
    // Defense ported from the retired legacy useSelectOffer: a 200 OK that echoes a
    // different application/tenant must be treated as a failure, not success.
    mockFetch({
      ok: true,
      offer: {
        offer_id: "off-1",
        application_id: "SOME-OTHER-APP",
        tenant_id: tenantId,
        lender_code: "banco_popular",
        status: "accepted",
      },
      application_state: "OFFER_SELECTED",
    });
    await expect(
      acceptOffer({ tenantId, applicationId: "app-1", offerId: "off-1" })
    ).rejects.toBeInstanceOf(CreditCoreApiError);
  });

  test("acceptOffer accepts a response that omits echoed application_id/tenant_id (no false rejection)", async () => {
    mockFetch({
      ok: true,
      offer: { offer_id: "off-1", status: "accepted" },
      application_state: "OFFER_SELECTED",
      siblings_not_selected: 1,
    });
    const res = await acceptOffer({ tenantId, applicationId: "app-1", offerId: "off-1" });
    expect(res.ok).toBe(true);
  });
});
