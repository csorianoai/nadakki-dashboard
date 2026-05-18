import {
  PERF_METRICS_REPORT_INTERVAL_MS,
  SENTRY_SAMPLE_RATE_DEV,
  SENTRY_SAMPLE_RATE_PROD,
} from "@/lib/observability/constants";
import { scrubSentryEvent, scrubUnknown } from "@/lib/observability/telemetry";

describe("lib/observability constants", () => {
  test("exports expected sampling and flush interval values", () => {
    expect(SENTRY_SAMPLE_RATE_PROD).toBe(0.1);
    expect(SENTRY_SAMPLE_RATE_DEV).toBe(1.0);
    expect(PERF_METRICS_REPORT_INTERVAL_MS).toBe(30_000);
  });
});

describe("scrubUnknown", () => {
  test("masks email-like strings in object values", () => {
    expect(scrubUnknown({ contact: "a@b.co" })).toEqual({ contact: "[redacted-email]" });
  });

  test("redacts sensitive key names regardless of value shape", () => {
    expect(scrubUnknown({ password: "secret", ok: 1 })).toEqual({ password: "[redacted]", ok: 1 });
  });
});

describe("scrubSentryEvent", () => {
  test("redacts PII-like fields on user and breadcrumb payloads", () => {
    const event = scrubSentryEvent({
      user: { nickname: "u@x.com" },
      breadcrumbs: [{ message: "visit u@x.com", data: { auth_token: "abc" } }],
    } as Parameters<typeof scrubSentryEvent>[0]);
    expect(event.user).toEqual({ nickname: "[redacted-email]" });
    expect((event.breadcrumbs?.[0]?.data as { auth_token?: string })?.auth_token).toBe("[redacted]");
  });
});
