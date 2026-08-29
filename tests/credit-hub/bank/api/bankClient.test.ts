import { bulkDecide, getAuditTrail, getQueue, recordDecision } from "@/lib/credit-hub/api/bankClient";

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

  test("bank audit viewer reads canonical application events and maps their real shape", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(
      await mockJson({
        trace_id: "trace-1",
        tenant_id: "tenant-a",
        application_id: "app-1",
        events: [
          {
            event_id: "evt-1",
            event_type: "APPLICATION_CLAIMED",
            payload: { actor_role: "bank_analyst" },
            emitted_at: "2026-08-28T12:00:00Z",
          },
          {
            event_id: "evt-2",
            event_type: "MULTI_LENDER_OFFERS_PERSISTED",
            payload: { offers_persisted: 2 },
            emitted_at: "2026-08-28T12:01:00Z",
          },
          {
            event_id: "evt-3",
            event_type: "BANK_DECISION_MADE",
            payload: { analyst_id: "analyst-42", decision: "APROBADO" },
            emitted_at: "2026-08-28T12:02:00Z",
          },
        ],
      }),
    );

    const result = await getAuditTrail({ tenantId: "tenant-a", applicationId: "app-1" });

    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v2/credit/applications/app-1/events");
    expect(result.events).toEqual([
      { event: "APPLICATION_CLAIMED", timestamp: "2026-08-28T12:00:00Z", by: "bank_analyst" },
      { event: "MULTI_LENDER_OFFERS_PERSISTED", timestamp: "2026-08-28T12:01:00Z", by: "Sistema" },
      { event: "BANK_DECISION_MADE", timestamp: "2026-08-28T12:02:00Z", by: "analyst-42", decision: "APROBADO" },
    ]);
    expect(result.event_count).toBe(3);
  });

  test("recordDecision claims then posts to decide endpoint", async () => {
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
    // Audit #4.6: claim-before-decide — claim is call[0], decide is call[1]
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/v2/credit/applications/app-1/claim");
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ analyst_id: "analyst-1" });
    expect(fetchSpy.mock.calls[1][0]).toBe("/api/v2/credit/applications/app-1/decide");
    expect(fetchSpy.mock.calls[1][1]?.method).toBe("POST");
  });

  test("recordDecision sends lender_code when the analyst selected one", async () => {
    const fetchSpy = installFetchMock().mockResolvedValue(await mockJson({ decision: "APROBADO" }));
    await recordDecision({
      tenantId: "tenant-a",
      applicationId: "app-1",
      body: {
        decision: "APROBADO",
        justification: "Lender seleccionado y documentación completa.",
        analyst_id: "analyst-1",
        lender_code: "pilot",
        terms: { approved_amount: 900000, interest_rate: 18, term_months: 60, down_payment_required: 300000, conditions: [] },
      },
    });
    const claimBody = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    const decideBody = JSON.parse(String(fetchSpy.mock.calls[1][1]?.body));
    expect(claimBody).toEqual({ analyst_id: "analyst-1", lender_code: "pilot" });
    expect(decideBody).not.toHaveProperty("lender_code");
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
