import {
  appendErrorRatePoint,
  snapshotFromPrometheusText,
  healthHintFromPrometheus,
} from "@/lib/admin/observability-prometheus-bridge";

describe("observability-prometheus-bridge", () => {
  test("snapshotFromPrometheusText extracts slices", () => {
    const text = `
http_request_duration_seconds_bucket{handler="/z",le="1"} 10
http_request_duration_seconds_bucket{handler="/z",le="+Inf"} 10
http_requests_total{tenant="t9",status="500"} 1
http_requests_total{tenant="t9",status="200"} 9
`;
    const snap = snapshotFromPrometheusText(text, "t9");
    expect(snap.endpoints.length).toBeGreaterThan(0);
    expect(snap.errorRatePct).toBe(10);
  });

  test("appendErrorRatePoint caps history length", () => {
    const long = Array.from({ length: 50 }, (_, i) => ({ t: `${i}`, rate: i }));
    const next = appendErrorRatePoint(long, 3, 5);
    expect(next).toHaveLength(5);
    expect(next[4].rate).toBe(3);
  });

  test("healthHintFromPrometheus reads up gauge", () => {
    const h = healthHintFromPrometheus("up 0\n");
    expect(h.status).toBe("critical");
  });
});
