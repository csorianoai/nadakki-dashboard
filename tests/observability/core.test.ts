import {
  PERF_METRICS_REPORT_INTERVAL_MS,
  SENTRY_SAMPLE_RATE_DEV,
  SENTRY_SAMPLE_RATE_PROD,
} from "@/lib/observability/constants";

describe("lib/observability constants", () => {
  test("exports expected sampling and flush interval values", () => {
    expect(SENTRY_SAMPLE_RATE_PROD).toBe(0.1);
    expect(SENTRY_SAMPLE_RATE_DEV).toBe(1.0);
    expect(PERF_METRICS_REPORT_INTERVAL_MS).toBe(30_000);
  });
});
