import { bulkDecide, getQueue, recordDecision } from "@/lib/credit-hub/api/bankClient";

function mockJson(body: unknown, status = 200) {
  const response = {
    status,
    statusText: status >= 400 ? "Error" : "OK",
    ok: status >= 200 && status < 300,
    clone: () => ({ json: async () => body }),
    json: async () => body,
  } as Response;
  return Promise.resolve(response);
}

function installFetchMock() {
  const fn = jest.fn();
  Object.defineProperty(global, "fetch", { value: fn, writable: true, configurable: true });
  return jest.spyOn(global, "fetch");
}

describe("bankClient", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  test("getQueue uses bank analyst role and tenant header", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({ applications: [], total: 0 }));
    await getQueue({ tenantId: "tenant-a" });
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v2/credit/applications/queue");
    expect(headers["X-Tenant-ID"]).toBe("tenant-a");
    expect(headers["X-Actor-Role"]).toBe("bank_analyst");
  });

  test("getQueue sends limit, offset, and filters", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(
      await mockJson({ applications: [], total: 0, total_count: 0 })
    );
    await getQueue({
      tenantId: "tenant-a",
      limit: 20,
      offset: 40,
      filters: { q: "acme", status: "" },
    });
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "/api/v2/credit/applications/queue?limit=20&offset=40&q=acme"
    );
  });

  test("recordDecision posts to decide endpoint", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({ decision: "APROBADO" }));
    await recordDecision({
      tenantId: "tenant-a",
      applicationId: "app-1",
      body: {
        decision: "APROBADO",
        justification: "Score alto y documentación completa.",
        analyst_id: "analyst-1",
        terms: { approved_amount: 900000, interest_rate: 18, term_months: 60, down_payment_required: 300000, conditions: [] },
      },
    });
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v2/credit/applications/app-1/decide");
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("POST");
  });

  test("bulkDecide sends rule and selected applications", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({ processed: 2, skipped: 0, errors: 0, results: [] }));
    await bulkDecide({
      tenantId: "tenant-a",
      applicationIds: ["a", "b"],
      rule: "APROBAR_SCORE_GTE_800",
      analystId: "analyst-1",
      justification: "Regla score alto.",
    });
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.application_ids).toEqual(["a", "b"]);
    expect(body.rule).toBe("APROBAR_SCORE_GTE_800");
  });
});
