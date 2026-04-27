import {
  CreditCoreApiError,
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

  test("creates application with payload", async () => {
    const fetchMock = mockFetch({ id: "app-created", applicant_name: "Ana" });
    await createApplication({
      tenantId,
      payload: { applicant_name: "Ana", source: "forge_dealer_portal" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/credit/applications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ applicant_name: "Ana", source: "forge_dealer_portal" }),
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
});
