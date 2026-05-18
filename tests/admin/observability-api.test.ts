import { fetchPrometheusMetrics, fetchObservabilityDashboard } from "@/lib/admin/observability-api";

describe("observability-api headers", () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  test("fetchPrometheusMetrics sends X-Role and X-Tenant-ID", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => "# empty\n",
    });
    await fetchPrometheusMetrics("tenant-1", "admin");
    expect(global.fetch).toHaveBeenCalledWith(
      "/metrics",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Tenant-ID": "tenant-1",
          "X-Role": "TENANT_ADMIN",
        }),
      }),
    );
  });

  test("fetchObservabilityDashboard uses JSON accept header", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { health: { status: "healthy" }, latency: [], error_rate: [] } }),
    });
    const out = await fetchObservabilityDashboard("tenant-1", "viewer");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/observability/dashboard"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          "X-Role": "BANK_ANALYST",
        }),
      }),
    );
    expect(out?.health.status).toBe("healthy");
  });
});
