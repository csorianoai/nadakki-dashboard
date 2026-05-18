import {
  buildEndpointLatencyStats,
  buildTenantErrorSlices,
  computeErrorRatePercent,
  parsePrometheusText,
} from "@/lib/admin/prometheus-parse";

describe("parsePrometheusText", () => {
  test("ignores comments and blank lines", () => {
    const text = `
# HELP x help
# TYPE x counter
x 1
`;
    const s = parsePrometheusText(text);
    expect(s).toEqual([{ name: "x", labels: {}, value: 1 }]);
  });

  test("parses labels and scientific notation", () => {
    const s = parsePrometheusText('http_requests{method="GET",status="500"} 2e3');
    expect(s).toHaveLength(1);
    expect(s[0].name).toBe("http_requests");
    expect(s[0].labels.method).toBe("GET");
    expect(s[0].labels.status).toBe("500");
    expect(s[0].value).toBe(2000);
  });

  test("skips malformed lines", () => {
    expect(parsePrometheusText("not-a-metric\nfoo 1\n")).toEqual([{ name: "foo", labels: {}, value: 1 }]);
  });
});

describe("buildEndpointLatencyStats", () => {
  test("derives p50/p95/p99 from histogram buckets (seconds → ms)", () => {
    const text = `
http_request_duration_seconds_bucket{handler="/a",le="0.1"} 10
http_request_duration_seconds_bucket{handler="/a",le="0.5"} 50
http_request_duration_seconds_bucket{handler="/a",le="1"} 90
http_request_duration_seconds_bucket{handler="/a",le="+Inf"} 100
`;
    const stats = buildEndpointLatencyStats(parsePrometheusText(text));
    expect(stats).toHaveLength(1);
    expect(stats[0].endpoint).toBe("/a");
    expect(stats[0].p50).toBe(500);
    expect(stats[0].p99).toBeGreaterThanOrEqual(1000);
  });

  test("reads summary quantiles when present", () => {
    const text = `
rpc_latency_seconds{quantile="0.5",path="/x"} 0.2
rpc_latency_seconds{quantile="0.95",path="/x"} 0.4
rpc_latency_seconds{quantile="0.99",path="/x"} 0.5
`;
    const stats = buildEndpointLatencyStats(parsePrometheusText(text));
    expect(stats.some((s) => s.endpoint === "/x" && s.p50 === 200 && s.p95 === 400)).toBe(true);
  });
});

describe("buildTenantErrorSlices", () => {
  test("aggregates 5xx as errors per tenant", () => {
    const text = `
http_requests_total{tenant="t1",status="200"} 80
http_requests_total{tenant="t1",status="500"} 20
`;
    const slices = buildTenantErrorSlices(parsePrometheusText(text));
    expect(slices).toContainEqual(
      expect.objectContaining({ tenant: "t1", errors: 20, total: 100 }),
    );
  });
});

describe("computeErrorRatePercent", () => {
  test("returns percentage for matching tenant", () => {
    const pct = computeErrorRatePercent(
      [{ tenant: "acme", errors: 1, total: 4 }],
      "acme",
    );
    expect(pct).toBe(25);
  });

  test("returns null for empty input", () => {
    expect(computeErrorRatePercent([], "x")).toBeNull();
  });
});
